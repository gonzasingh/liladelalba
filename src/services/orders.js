import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Guarda la orden en la colección "orders" y devuelve el ID generado por Firestore.
// Queda "pendiente" hasta que el panel de administración la confirme.
export async function createOrder({ user, buyer, items, totalQuantity, paymentMethod, subtotal, surcharge, shipping, total }) {
  const order = {
    userId: user.uid,
    userEmail: user.email,
    buyer,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      variant: item.variant ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      surcharge: item.surcharge,
    })),
    totalQuantity,
    payment: { method: paymentMethod },
    subtotal,
    surcharge,
    shipping,
    total,
    channel: 'web',
    status: 'pendiente',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'orders'), order);
  return docRef.id;
}
