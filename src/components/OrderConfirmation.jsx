import { Link } from 'react-router-dom';

export default function OrderConfirmation({ confirmation }) {
  return (
    <section className="confirmation" aria-labelledby="confirmation-title">
      <h1 id="confirmation-title" className="page-title">
        ¡Gracias por tu compra!
      </h1>
      <p>Registramos tu orden. Guardá este ID para consultar tu pedido:</p>
      <p className="confirmation__id">{confirmation.orderId}</p>
      <p>
        Abrimos WhatsApp con el detalle de tu pedido y tus datos de entrega. Tocá <strong>Enviar</strong> para que lo
        recibamos. Si no se abrió, usá este botón:
      </p>
      <a className="btn btn--dark" href={confirmation.whatsappUrl} target="_blank" rel="noopener noreferrer">
        Enviar pedido por WhatsApp
      </a>
      <Link className="btn btn--ghost" to="/">
        Volver a la tienda
      </Link>
    </section>
  );
}
