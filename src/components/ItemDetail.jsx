import { useState } from 'react';
import { Link } from 'react-router-dom';
import ItemCount from './ItemCount';
import { getCategory } from '../data/categories';
import { BULK_MIN_QUANTITY, useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

export default function ItemDetail({ product }) {
  const { addItem, getQuantityInCart } = useCart();
  const options = product.options ?? [];
  const category = getCategory(product.category);

  const [selected, setSelected] = useState({});
  const [missingOption, setMissingOption] = useState(false);
  const [added, setAdded] = useState(null);

  const inCart = getQuantityInCart(product.id);
  const available = Math.max(0, product.stock - inCart);

  const handleSelect = (label, value) => {
    setSelected((current) => ({ ...current, [label]: value }));
    setMissingOption(false);
  };

  const handleAdd = (quantity) => {
    if (!options.every((option) => selected[option.label])) {
      setMissingOption(true);
      return;
    }
    const variant = options.length ? options.map((option) => selected[option.label]).join(' · ') : null;
    addItem(product, quantity, variant);
    setAdded({ quantity, variant });
  };

  return (
    <article className="detail">
      <div className="detail__media">
        <img src={product.image} alt={product.name} />
      </div>

      <div className="detail__info">
        {category && (
          <Link className="detail__back" to={`/category/${category.id}`}>
            ← {category.label}
          </Link>
        )}
        <h1 className="detail__title">{product.name}</h1>
        <p className="detail__text">{product.description}</p>

        <p className="detail__price">
          <span className="price price--lg">{formatPrice(product.price)}</span>
        </p>
        {product.priceX10 != null && (
          <p className="detail__bulk">
            Llevando {BULK_MIN_QUANTITY} unidades o más del mismo producto: {formatPrice(product.priceX10)} cada una.
          </p>
        )}

        {options.map((option) => (
          <div className="field" key={option.label}>
            <label htmlFor={`option-${option.label}`}>{option.label}</label>
            <select
              id={`option-${option.label}`}
              className={`input${missingOption && !selected[option.label] ? ' input--invalid' : ''}`}
              value={selected[option.label] ?? ''}
              onChange={(e) => handleSelect(option.label, e.target.value)}
            >
              <option value="">Elegí una opción</option>
              {option.values.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        ))}
        {missingOption && (
          <p className="field__error" role="alert">
            Elegí todas las opciones antes de agregar el producto.
          </p>
        )}

        <p className="detail__stock">
          {product.stock <= 0
            ? 'Sin stock por el momento.'
            : available === 0
              ? `Ya tenés en el carrito las ${product.stock} unidades disponibles.`
              : `Stock disponible: ${available} ${available === 1 ? 'unidad' : 'unidades'}`}
        </p>

        <ItemCount max={available} onAdd={handleAdd} disabled={product.stock <= 0} />

        {added && (
          <div className="message message--success" role="status">
            <p className="message__text">
              Agregaste {added.quantity} {added.quantity === 1 ? 'unidad' : 'unidades'}
              {added.variant ? ` (${added.variant})` : ''} al carrito.
            </p>
            <div className="message__action">
              <Link className="btn btn--dark btn--sm" to="/cart">
                Ver carrito
              </Link>
              <Link className="btn btn--ghost btn--sm" to="/checkout">
                Finalizar compra
              </Link>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
