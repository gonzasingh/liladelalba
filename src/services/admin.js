import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatPrice, shortId } from '../utils/format';
import { unitPriceFor } from '../utils/pricing';

// Errores con un mensaje pensado para mostrarse tal cual en pantalla.
export class UserError extends Error {}

export const describeError = (error) =>
  error instanceof UserError ? error.message : 'No pudimos guardar los cambios. Revisá tu conexión y probá de nuevo.';

const movementData = ({ type, method, amount, destination, detail = '', saleId = null }) => ({
  type,
  method,
  amount,
  destination,
  detail,
  saleId,
  createdAt: serverTimestamp(),
});

// ---------- Productos y stock ----------

export const addProduct = (data) => addDoc(collection(db, 'products'), { ...data, addedAt: serverTimestamp() });

export const updateProduct = (id, patch) => updateDoc(doc(db, 'products', id), patch);

export const deleteProduct = (id) => deleteDoc(doc(db, 'products', id));

export async function loadInitialCatalog(initialProducts, existingIds = []) {
  const batch = writeBatch(db);
  initialProducts
    .filter((product) => !existingIds.includes(product.id))
    .forEach(({ id, ...data }) => {
      batch.set(doc(db, 'products', id), { ...data, cost: 0, addedAt: serverTimestamp() });
    });
  await batch.commit();
}

// ---------- Ventas ----------

// Venta fuera de la web: descuenta stock, crea la venta y registra el cobro en la caja.
export function registerOfflineSale({ productId, variant, quantity, client, method, paid }) {
  return runTransaction(db, async (tx) => {
    const productRef = doc(db, 'products', productId);
    const snapshot = await tx.get(productRef);
    if (!snapshot.exists()) throw new UserError('Ese producto ya no existe.');

    const product = snapshot.data();
    if (!Number.isInteger(quantity) || quantity < 1) throw new UserError('Ingresá una cantidad válida.');
    if (quantity > product.stock) throw new UserError(`Solo quedan ${product.stock} unidades de ${product.name}.`);

    const unitPrice = unitPriceFor(product, quantity);
    const total = unitPrice * quantity;
    const amountPaid = paid == null ? total : paid;
    if (amountPaid < 0 || amountPaid > total) {
      throw new UserError(`El pago debe estar entre $ 0 y ${formatPrice(total)}.`);
    }

    const saleRef = doc(collection(db, 'sales'));
    const clientName = client || 'Sin nombre';

    tx.update(productRef, { stock: product.stock - quantity });
    tx.set(saleRef, {
      productId,
      name: product.name,
      variant: variant || null,
      quantity,
      unitPrice,
      total,
      paid: amountPaid,
      client: clientName,
      channel: 'local',
      orderId: null,
      createdAt: serverTimestamp(),
    });
    if (amountPaid > 0) {
      tx.set(
        doc(collection(db, 'movements')),
        movementData({
          type: 'ingreso',
          method,
          amount: amountPaid,
          destination: 'Venta',
          detail: `Venta ${shortId(saleRef.id)} · ${clientName}`,
          saleId: saleRef.id,
        })
      );
    }
    return saleRef.id;
  });
}

// Cobro posterior de una venta con saldo pendiente.
export function registerPayment(saleId, { amount, method }) {
  return runTransaction(db, async (tx) => {
    const saleRef = doc(db, 'sales', saleId);
    const snapshot = await tx.get(saleRef);
    if (!snapshot.exists()) throw new UserError('Esa venta ya no existe.');

    const sale = snapshot.data();
    const value = Math.min(amount, sale.total - sale.paid);
    if (!(value > 0)) throw new UserError('Esta venta ya está paga.');

    tx.update(saleRef, { paid: sale.paid + value });
    tx.set(
      doc(collection(db, 'movements')),
      movementData({
        type: 'ingreso',
        method,
        amount: value,
        destination: 'Venta',
        detail: `Cobro ${shortId(saleId)} · ${sale.client}`,
        saleId,
      })
    );
  });
}

// ---------- Pedidos de la web ----------

// Confirma un pedido web: descuenta el stock, crea una venta por producto y registra el cobro.
export function confirmWebOrder(orderId, { method, paid }) {
  return runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnapshot = await tx.get(orderRef);
    if (!orderSnapshot.exists() || orderSnapshot.data().status !== 'pendiente') {
      throw new UserError('Este pedido ya fue procesado.');
    }
    const order = orderSnapshot.data();

    const needed = {};
    order.items.forEach((item) => {
      needed[item.id] = (needed[item.id] ?? 0) + item.quantity;
    });
    const productIds = Object.keys(needed);
    const productSnapshots = await Promise.all(productIds.map((id) => tx.get(doc(db, 'products', id))));

    productSnapshots.forEach((snapshot, index) => {
      if (!snapshot.exists()) throw new UserError('Uno de los productos del pedido ya no existe.');
      const { name, stock } = snapshot.data();
      if (stock < needed[productIds[index]]) {
        throw new UserError(`No hay stock suficiente de ${name}: quedan ${stock} y el pedido pide ${needed[productIds[index]]}.`);
      }
    });

    const totalPaid = paid == null ? order.total : paid;
    if (totalPaid < 0 || totalPaid > order.total) {
      throw new UserError(`El pago debe estar entre $ 0 y ${formatPrice(order.total)}.`);
    }

    productSnapshots.forEach((snapshot, index) => {
      tx.update(snapshot.ref, { stock: snapshot.data().stock - needed[productIds[index]] });
    });

    // El cobro se reparte primero entre los productos (con su recargo de tarjeta) y al final el envío.
    let remaining = totalPaid;
    order.items.forEach((item) => {
      const surcharge = item.surcharge ?? 0;
      const lineTotal = item.subtotal + surcharge;
      const linePaid = Math.min(remaining, lineTotal);
      remaining -= linePaid;
      tx.set(doc(collection(db, 'sales')), {
        productId: item.id,
        name: item.name,
        variant: item.variant ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        surcharge,
        total: lineTotal,
        paid: linePaid,
        client: order.buyer.name,
        channel: 'web',
        orderId,
        createdAt: order.createdAt ?? serverTimestamp(),
      });
    });

    if (order.shipping?.cost > 0) {
      const linePaid = Math.min(remaining, order.shipping.cost);
      tx.set(doc(collection(db, 'sales')), {
        kind: 'envio',
        productId: null,
        name: `Envío a domicilio (${order.shipping.carrier}) · ${order.shipping.province}`,
        variant: null,
        quantity: 1,
        unitPrice: order.shipping.cost,
        surcharge: 0,
        total: order.shipping.cost,
        paid: linePaid,
        client: order.buyer.name,
        channel: 'web',
        orderId,
        createdAt: order.createdAt ?? serverTimestamp(),
      });
    }

    if (totalPaid > 0) {
      tx.set(
        doc(collection(db, 'movements')),
        movementData({
          type: 'ingreso',
          method,
          amount: totalPaid,
          destination: 'Venta',
          detail: `Pedido web ${shortId(orderId)} · ${order.buyer.name}`,
        })
      );
    }

    tx.update(orderRef, { status: 'confirmada', confirmedAt: serverTimestamp() });
  });
}

export const cancelWebOrder = (orderId) =>
  updateDoc(doc(db, 'orders', orderId), { status: 'cancelada', cancelledAt: serverTimestamp() });

// ---------- Caja ----------

export const addMovement = (data) => addDoc(collection(db, 'movements'), movementData(data));

export const deleteMovement = (id) => deleteDoc(doc(db, 'movements', id));

// Fragancias que se suman a las 16 de la marca. Se guardan en settings/fragrances.
export const saveCustomFragrances = (custom) => setDoc(doc(db, 'settings', 'fragrances'), { custom }, { merge: true });

export const saveCashCount = (patch) => setDoc(doc(db, 'settings', 'cashCount'), patch, { merge: true });
