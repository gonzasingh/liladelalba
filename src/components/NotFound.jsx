import { Link } from 'react-router-dom';
import Message from './Message';

export default function NotFound() {
  return (
    <Message
      title="Esta página no existe"
      action={
        <Link className="btn btn--dark" to="/">
          Ir a la tienda
        </Link>
      }
    >
      El enlace que abriste no corresponde a ninguna sección de la tienda.
    </Message>
  );
}
