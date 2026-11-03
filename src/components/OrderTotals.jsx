import { SHIPPING_CARRIER } from '../data/checkout';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

// Sin "detailed": subtotal (con el recargo de tarjeta incluido), envío y total, como en el carrito.
// Con "detailed": desglose completo de la compra.
export default function OrderTotals({ detailed = false }) {
  const { totalQuantity, subtotal, surcharge, shipping, total, paymentMethod } = useCart();
  const showTotal = Boolean(paymentMethod && shipping);

  const shippingLabel = <dt>Envío a domicilio ({SHIPPING_CARRIER})*</dt>;

  if (detailed) {
    return (
      <dl className="summary__rows">
        <div>
          <dt>Unidades</dt>
          <dd>{totalQuantity}</dd>
        </div>
        <div>
          <dt>Productos</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        {surcharge > 0 && (
          <div>
            <dt>Recargo tarjeta (15%)</dt>
            <dd>{formatPrice(surcharge)}</dd>
          </div>
        )}
        <div>
          {shippingLabel}
          <dd>{shipping ? formatPrice(shipping.cost) : '-'}</dd>
        </div>
        <div className="summary__total">
          <dt>Total</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      </dl>
    );
  }

  return (
    <dl className="summary__rows">
      <div>
        <dt>Subtotal</dt>
        <dd>{paymentMethod ? formatPrice(subtotal + surcharge) : '-'}</dd>
      </div>
      <div>
        {shippingLabel}
        <dd>{shipping ? formatPrice(shipping.cost) : '-'}</dd>
      </div>
      {showTotal && (
        <div className="summary__total">
          <dt>Total</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      )}
    </dl>
  );
}
