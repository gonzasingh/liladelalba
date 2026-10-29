import { useState } from 'react';

// Selector de cantidad: nunca permite superar "max" (chequearel stock que todavía se puede agregar).
export default function ItemCount({ max, onAdd, disabled = false }) {
  const [count, setCount] = useState(1);
  const value = Math.min(count, Math.max(max, 1));
  const canAdd = !disabled && max >= 1;

  return (
    <div className="itemcount">
      <div className="count" role="group" aria-label="Cantidad">
        <button type="button" onClick={() => setCount(value - 1)} disabled={value <= 1} aria-label="Restar una unidad">
          −
        </button>
        <span aria-live="polite">{value}</span>
        <button type="button" onClick={() => setCount(value + 1)} disabled={value >= max} aria-label="Sumar una unidad">
          +
        </button>
      </div>
      <button type="button" className="btn btn--dark" onClick={() => onAdd(value)} disabled={!canAdd}>
        Agregar al carrito
      </button>
    </div>
  );
}
