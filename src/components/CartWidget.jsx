import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartWidget() {
  const { totalQuantity } = useCart();

  return (
    <Link
      to="/cart"
      className="cartwidget"
      aria-label={`Carrito: ${totalQuantity} ${totalQuantity === 1 ? 'producto' : 'productos'}`}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      {totalQuantity > 0 && <span className="cartwidget__badge">{totalQuantity}</span>}
    </Link>
  );
}
