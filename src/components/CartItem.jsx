import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

export default function CartItem({ item }) {
  const { removeItem } = useCart();

  return (
    <li className="cartitem">
      <Link to={`/item/${item.id}`} className="cartitem__img">
        <img src={item.image} alt="" />
      </Link>

      <div className="cartitem__info">
        <Link className="cartitem__name" to={`/item/${item.id}`}>
          {item.name}
        </Link>
        {item.variant && <p className="cartitem__variant">{item.variant}</p>}
        <p className="cartitem__meta">
          {item.quantity} × {formatPrice(item.unitPrice)}
          {item.bulk && <span className="cartitem__bulk"> · precio por 10 unidades o más</span>}
        </p>
      </div>

      <div className="cartitem__side">
        <strong>{formatPrice(item.subtotal)}</strong>
        <button
          type="button"
          className="linkbtn"
          onClick={() => removeItem(item.key)}
          aria-label={`Eliminar ${item.name}${item.variant ? ` (${item.variant})` : ''} del carrito`}
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}
