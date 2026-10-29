import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Guarda la orden en la colección "orders" y devuelve el ID generado por Firestore.
export async function createOrder({ user, buyer, items, totalQuantity, total }) {
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
    })),
    totalQuantity,
    total,
    status: 'generada',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'orders'), order);
  return docRef.id;
}
