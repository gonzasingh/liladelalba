import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';

// Escucha una colección de Firestore en tiempo real: los cambios se reflejan sin recargar.
export function useCollection(name, { orderField, max = 500 } = {}) {
  const [state, setState] = useState({ data: [], loading: true, error: '' });

  useEffect(() => {
    const source = orderField
      ? query(collection(db, name), orderBy(orderField, 'desc'), limit(max))
      : collection(db, name);

    return onSnapshot(
      source,
      (snapshot) =>
        setState({
          data: snapshot.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })),
          loading: false,
          error: '',
        }),
      () => setState({ data: [], loading: false, error: 'No pudimos cargar los datos. Revisá tu conexión y tus permisos.' })
    );
  }, [name, orderField, max]);

  return state;
}
