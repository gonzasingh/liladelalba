import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthForm from './AuthForm';
import CheckoutForm from './CheckoutForm';
import Loader from './Loader';
import Message from './Message';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orders';
import { formatPrice } from '../utils/format';

function OrderSummary({ items, totalQuantity, totalPrice }) {
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
      <dl className="summary__rows">
        <div>
          <dt>Unidades</dt>
          <dd>{totalQuantity}</dd>
        </div>
        <div className="summary__total">
          <dt>Total</dt>
          <dd>{formatPrice(totalPrice)}</dd>
        </div>
      </dl>
    </aside>
  );
}

export default function Checkout() {
  const { user, loading: authLoading } = useAuth();
  const { items, totalQuantity, totalPrice, clearCart } = useCart();

  const [authMode, setAuthMode] = useState('login');
  const [orderId, setOrderId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (buyer) => {
    if (saving || items.length === 0) return;

    setSaving(true);
    setError('');
    try {
      const id = await createOrder({ user, buyer, items, totalQuantity, total: totalPrice });
      // El carrito se vacía recién cuando Firestore confirmó que la orden se guardó.
      clearCart();
      setOrderId(id);
    } catch {
      setError('No pudimos registrar tu compra. Tu carrito sigue intacto, probá de nuevo en unos instantes.');
    } finally {
      setSaving(false);
    }
  };

  if (orderId) {
    return (
      <section className="confirmation" aria-labelledby="confirmation-title">
        <h1 id="confirmation-title" className="page-title">
          ¡Gracias por tu compra!
        </h1>
        <p>Registramos tu orden. Guardá este ID para consultar tu pedido:</p>
        <p className="confirmation__id">{orderId}</p>
        <Link className="btn btn--dark" to="/">
          Volver a la tienda
        </Link>
      </section>
    );
  }

  if (authLoading) return <Loader text="Verificando tu sesión…" />;

  if (!user) {
    return (
      <section className="checkout" aria-labelledby="checkout-title">
        <div>
          <h1 id="checkout-title" className="page-title">
            Finalizar compra
          </h1>
          <p className="checkout__lead">
            Para confirmar tu pedido necesitás ingresar a tu cuenta. Tu carrito se mantiene mientras tanto.
          </p>
          <AuthForm key={authMode} mode={authMode} onSwitch={setAuthMode} />
        </div>
        {items.length > 0 && <OrderSummary items={items} totalQuantity={totalQuantity} totalPrice={totalPrice} />}
      </section>
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

  return (
    <section className="checkout" aria-labelledby="checkout-title">
      <div>
        <h1 id="checkout-title" className="page-title">
          Finalizar compra
        </h1>
        <p className="checkout__lead">Compra como {user.email}.</p>
        <CheckoutForm defaultEmail={user.email ?? ''} submitting={saving} error={error} onSubmit={handleSubmit} />
      </div>
      <OrderSummary items={items} totalQuantity={totalQuantity} totalPrice={totalPrice} />
    </section>
  );
}
