import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format';

export default function Item({ product }) {
  const soldOut = product.stock <= 0;

  return (
    <article className="card">
      <Link to={`/item/${product.id}`} className="card__img" tabIndex={-1} aria-hidden="true">
        <img src={product.image} alt="" loading="lazy" />
      </Link>
      <div className="card__body">
        <h3 className="card__title">
          <Link to={`/item/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="card__text">{product.description}</p>
        <div className="card__foot">
          <span className="price">{formatPrice(product.price)}</span>
          {soldOut ? (
            <span className="card__soldout">Sin stock</span>
          ) : (
            <Link className="btn btn--dark btn--sm" to={`/item/${product.id}`}>
              Ver detalle
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
