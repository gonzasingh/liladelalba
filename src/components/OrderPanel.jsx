import { useState } from 'react';
import { Link } from 'react-router-dom';
import OrderTotals from './OrderTotals';
import { PROVINCES, STORE_PAYMENT_METHODS } from '../data/checkout';
import { useCart } from '../context/CartContext';

// Resumen del carrito: datos de envío, método de pago, totales y botón para finalizar.
export default function OrderPanel({ onFinalize, busy, error }) {
  const { delivery, paymentMethod, orderErrors, isOrderComplete, setDeliveryField, setPaymentMethod } = useCart();
  const [touched, setTouched] = useState({});

  const markTouched = (field) => () => setTouched((current) => ({ ...current, [field]: true }));
  const errorFor = (field) => (touched[field] ? orderErrors[field] : undefined);

  const errorText = (field) =>
    errorFor(field) && (
      <span id={`order-${field}-error`} className="field__error">
        {errorFor(field)}
      </span>
    );

  const inputProps = (field, placeholder, extra = {}) => ({
    id: `order-${field}`,
    className: `input${errorFor(field) ? ' input--invalid' : ''}`,
    placeholder,
    'aria-label': placeholder,
    'aria-invalid': Boolean(errorFor(field)),
    'aria-describedby': errorFor(field) ? `order-${field}-error` : undefined,
    value: delivery[field],
    onChange: (event) => setDeliveryField(field, event.target.value),
    onBlur: markTouched(field),
    ...extra,
  });

  return (
    <aside className="summary" aria-label="Resumen de la compra">
      <h2 className="summary__title">Resumen</h2>

      <div className="summary__block">
        <h3 className="summary__subtitle">Datos de envío</h3>
        <div className="field">
          <input {...inputProps('name', 'Nombre y apellido', { autoComplete: 'name' })} />
          {errorText('name')}
        </div>
        <div className="summary__pair">
          <div className="field">
            <input {...inputProps('postalCode', 'Código postal', { autoComplete: 'postal-code', maxLength: 10 })} />
            {errorText('postalCode')}
          </div>
          <div className="field">
            <select
              {...inputProps('province', 'Provincia', { autoComplete: 'address-level1', placeholder: undefined })}
              onChange={(event) => {
                setDeliveryField('province', event.target.value);
                markTouched('province')();
                if (delivery.postalCode) markTouched('postalCode')();
              }}
            >
              <option value="">Provincia</option>
              {PROVINCES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {errorText('province')}
          </div>
        </div>
        <div className="field">
          <input {...inputProps('city', 'Localidad', { autoComplete: 'address-level2' })} />
          {errorText('city')}
        </div>
        <div className="field">
          <input {...inputProps('address', 'Calle, número, piso o depto.', { autoComplete: 'street-address' })} />
          {errorText('address')}
        </div>
      </div>

      <div className="summary__block">
        <h3 className="summary__subtitle">Método de pago</h3>
        <div className="field">
          <select
            id="order-paymentMethod"
            className={`input${errorFor('paymentMethod') ? ' input--invalid' : ''}`}
            aria-label="Método de pago"
            value={paymentMethod ?? ''}
            onChange={(event) => setPaymentMethod(event.target.value)}
            onBlur={markTouched('paymentMethod')}
          >
            <option value="">Selecciona una opción</option>
            {STORE_PAYMENT_METHODS.map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
          {errorText('paymentMethod')}
        </div>
      </div>

      <div className="summary__totals">
        <OrderTotals />
      </div>

      {!isOrderComplete && (
        <p className="summary__hint">Completa los datos de envío y selecciona un método de pago para finalizar</p>
      )}
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="btn btn--dark btn--block" disabled={!isOrderComplete || busy} onClick={onFinalize}>
        {busy ? 'Procesando tu compra…' : 'Finalizar compra'}
      </button>
      <Link className="btn btn--ghost btn--block" to="/">
        Seguir comprando
      </Link>
    </aside>
  );
}
