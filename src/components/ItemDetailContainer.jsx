import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ItemDetail from './ItemDetail';
import Loader from './Loader';
import Message from './Message';
import { getProductById } from '../services/products';

function ProductView({ id }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    getProductById(id)
      .then((data) => active && setProduct(data))
      .catch(() => active && setError('No pudimos cargar este producto. Revisá tu conexión y probá de nuevo.'))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id, attempt]);

  if (loading) return <Loader text="Cargando producto…" />;

  if (error) {
    return (
      <Message
        type="error"
        title="Algo salió mal"
        action={
          <button type="button" className="btn btn--dark" onClick={() => setAttempt((n) => n + 1)}>
            Reintentar
          </button>
        }
      >
        {error}
      </Message>
    );
  }

  if (!product) {
    return (
      <Message
        title="No encontramos este producto"
        action={
          <Link className="btn btn--dark" to="/">
            Ver todos los productos
          </Link>
        }
      >
        Puede que ya no esté disponible o que el enlace sea incorrecto.
      </Message>
    );
  }

  return <ItemDetail product={product} />;
}

export default function ItemDetailContainer() {
  const { id } = useParams();
  return <ProductView key={id} id={id} />;
}
