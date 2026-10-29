// Carga (o actualiza) el catálogo en Cloud Firestore.
// Uso: npm run seed   (necesita el archivo .env con los datos de Firebase)
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, writeBatch } from 'firebase/firestore';
import { products } from './products.mjs';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error('Falta el archivo .env con las variables VITE_FIREBASE_*.');
  process.exit(1);
}

const db = getFirestore(initializeApp(firebaseConfig));

try {
  const batch = writeBatch(db);
  products.forEach(({ id, ...data }) => batch.set(doc(db, 'products', id), data));
  await batch.commit();
  console.log(`Listo: ${products.length} productos cargados en Firestore.`);
  process.exit(0);
} catch (error) {
  console.error('No se pudo cargar el catálogo:', error.message);
  console.error('Revisá que Firestore esté creado y que las reglas permitan escribir mientras cargás los datos.');
  process.exit(1);
}
