import { Link, useNavigate } from 'react-router-dom';
import CartItem from './CartItem';
import Message from './Message';
import OrderConfirmation from './OrderConfirmation';
import OrderPanel from './OrderPanel';
import ShippingNote from './ShippingNote';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useOrderSubmit } from '../hooks/useOrderSubmit';

export default function Cart() {
  const { items, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { submit, saving, error, confirmation } = useOrderSubmit();
  const navigate = useNavigate();

  if (confirmation) return <OrderConfirmation confirmation={confirmation} />;

  if (items.length === 0) {
    return (
      <Message
        title="Tu carrito está vacío"
        action={
          <Link className="btn btn--dark" to="/">
            Ver productos
          </Link>
        }
      >
        Sumá productos desde el catálogo y los vas a ver acá.
      </Message>
    );
  }

  // Con sesión iniciada la compra se finaliza acá mismo; sin sesión, se pide ingresar en /checkout.
  const handleFinalize = () => {
    if (user) submit();
    else navigate('/checkout');
  };

  return (
    <>
      <section className="cart" aria-labelledby="cart-title">
        <div className="cart__list">
          <h1 id="cart-title" className="page-title">
            Tu carrito
          </h1>
          <ul className="cart__items">
            {items.map((item) => (
              <CartItem key={item.key} item={item} />
            ))}
          </ul>
          <button type="button" className="linkbtn" onClick={clearCart}>
            Vaciar carrito
          </button>
        </div>

        <OrderPanel onFinalize={handleFinalize} busy={saving || authLoading} error={error} />
      </section>
      <ShippingNote />
    </>
  );
}
