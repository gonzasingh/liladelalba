import { Link } from 'react-router-dom';
import CartItem from './CartItem';
import Message from './Message';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

export default function Cart() {
  const { items, totalQuantity, totalPrice, clearCart } = useCart();

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

  return (
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

      <aside className="summary" aria-label="Resumen de la compra">
        <h2 className="summary__title">Resumen</h2>
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
        <Link className="btn btn--dark btn--block" to="/checkout">
          Finalizar compra
        </Link>
        <Link className="btn btn--ghost btn--block" to="/">
          Seguir comprando
        </Link>
      </aside>
    </section>
  );
}
