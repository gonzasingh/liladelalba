import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
const toProduct = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

// revisar si Sin categoryId trae todo el catálogo
export async function getProducts(categoryId) {
  const productsRef = collection(db, 'products');
  const source = categoryId ? query(productsRef, where('category', '==', categoryId)) : productsRef;
  const snapshot = await getDocs(source);
  return snapshot.docs.map(toProduct).sort(byOrder);
}

// Devuelve null si el producto no existe.
export async function getProductById(id) {
  const snapshot = await getDoc(doc(db, 'products', id));
  return snapshot.exists() ? toProduct(snapshot) : null;
}
