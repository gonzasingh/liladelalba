import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthForm from './AuthForm';
import Loader from './Loader';
import Message from './Message';
import OrderConfirmation from './OrderConfirmation';
import OrderTotals from './OrderTotals';
import ShippingNote from './ShippingNote';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getPaymentLabel } from '../data/checkout';
import { useOrderSubmit } from '../hooks/useOrderSubmit';
import { formatPrice } from '../utils/format';

function OrderSummary({ items }) {
  return (
    <aside className="summary" aria-label="Resumen de tu pedido">
      <h2 className="summary__title">Tu pedido</h2>
      <ul className="summary__items">
        {items.map((item) => (
          <li key={item.key}>
            <span>
              {item.quantity} × {item.name}
              {item.variant && <small> ({item.variant})</small>}
            </span>
            <span>{formatPrice(item.subtotal)}</span>
          </li>
        ))}
      </ul>
      <OrderTotals detailed />
    </aside>
  );
}

// Paso final: pide ingresar si no hay sesión y, con sesión, confirma el pedido cargado en el carrito.
export default function Checkout() {
  const { user, loading: authLoading } = useAuth();
  const { items, delivery, paymentMethod, isOrderComplete } = useCart();
  const { submit, saving, error, confirmation } = useOrderSubmit();
  const [authMode, setAuthMode] = useState('login');

  if (confirmation) return <OrderConfirmation confirmation={confirmation} />;

  if (authLoading) return <Loader text="Verificando tu sesión…" />;

  if (!user) {
    return (
      <>
        <section className="checkout" aria-labelledby="checkout-title">
          <div>
            <h1 id="checkout-title" className="page-title">
              Finalizar compra
            </h1>
            <p className="checkout__lead">
              Para confirmar tu pedido necesitás ingresar a tu cuenta. Tu carrito y tus datos de envío se mantienen
              mientras tanto.
            </p>
            <AuthForm key={authMode} mode={authMode} onSwitch={setAuthMode} />
          </div>
          {items.length > 0 && <OrderSummary items={items} />}
        </section>
        <ShippingNote />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <Message
        title="No hay productos para comprar"
        action={
          <Link className="btn btn--dark" to="/">
            Ver productos
          </Link>
        }
      >
        Tu carrito está vacío. Sumá productos desde el catálogo para poder finalizar la compra.
      </Message>
    );
  }

  if (!isOrderComplete) {
    return (
      <Message
        title="Faltan datos para finalizar"
        action={
          <Link className="btn btn--dark" to="/cart">
            Volver al carrito
          </Link>
        }
      >
        Completá los datos de envío y elegí el método de pago en el carrito para poder confirmar tu pedido.
      </Message>
    );
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    submit();
  };

  return (
    <>
      <section className="checkout" aria-labelledby="checkout-title">
        <form className="form" onSubmit={handleSubmit}>
          <h1 id="checkout-title" className="page-title">
            Confirmá tu pedido
          </h1>
          <p className="checkout__lead">Compra como {user.email}.</p>

          <dl className="review">
            <div>
              <dt>Nombre</dt>
              <dd>{delivery.name}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>
                {delivery.address}, {delivery.city}, {delivery.province} (CP {delivery.postalCode})
              </dd>
            </div>
            <div>
              <dt>Método de pago</dt>
              <dd>{getPaymentLabel(paymentMethod)}</dd>
            </div>
          </dl>
          <Link className="linkbtn" to="/cart">
            Editar en el carrito
          </Link>

          {error && (
            <p className="form__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--dark btn--block" disabled={saving}>
            {saving ? 'Procesando tu compra…' : 'Confirmar y enviar por WhatsApp'}
          </button>
        </form>
        <OrderSummary items={items} />
      </section>
      <ShippingNote />
    </>
  );
}
