import { SHIPPING_CARRIER, SHIPPING_ZONES, STORE_PAYMENT_METHODS } from '../data/checkout';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

// Método de pago y provincia de entrega. Se usa en el carrito y en el checkout.
export default function OrderOptions({ errors = {} }) {
  const { paymentMethod, setPaymentMethod, province, setProvince } = useCart();

  return (
    <div className="options">
      <fieldset className="fieldset">
        <legend>Método de pago</legend>
        {STORE_PAYMENT_METHODS.map((method) => (
          <label className="radio" key={method.id}>
            <input
              type="radio"
              name="payment-method"
              value={method.id}
              checked={paymentMethod === method.id}
              onChange={() => setPaymentMethod(method.id)}
            />
            {method.label}
          </label>
        ))}
        <span className="field__hint">El recargo de la tarjeta se aplica solo a los productos, no al envío.</span>
        {!paymentMethod && errors.paymentMethod && <span className="field__error">{errors.paymentMethod}</span>}
      </fieldset>

      <div className="field">
        <label htmlFor="province">Provincia o zona de entrega ({SHIPPING_CARRIER})</label>
        <select
          id="province"
          className={`input${!province && errors.province ? ' input--invalid' : ''}`}
          value={province ?? ''}
          onChange={(e) => setProvince(e.target.value)}
        >
          <option value="">Elegí una opción</option>
          {SHIPPING_ZONES.map((zone) => (
            <optgroup key={zone.id} label={`${zone.label} · ${formatPrice(zone.price)}`}>
              {zone.provinces.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {!province && errors.province && <span className="field__error">{errors.province}</span>}
      </div>
    </div>
  );
}
