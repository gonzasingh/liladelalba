import { useMemo, useState } from 'react';
import Loader from '../Loader';
import Message from '../Message';
import { PAYMENT_METHODS } from '../../data/admin';
import { getPaymentLabel } from '../../data/checkout';
import { useCollection } from '../../hooks/useCollection';
import { cancelWebOrder, confirmWebOrder, describeError, registerPayment } from '../../services/admin';
import { formatPrice, shortId } from '../../utils/format';
import { groupSalesByWeek, saleStatus, STATUS_LABELS } from '../../utils/sales';
import { formatShortDate, toDate } from '../../utils/weeks';

function Stat({ dot, label, value }) {
  return (
    <div className="stat">
      <p className="stat__label">
        {dot && <span className={`dot dot--${dot}`} aria-hidden="true" />}
        {label}
      </p>
      <p className="stat__value">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className="badge">
      <span className={`dot dot--${status}`} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

function SaleRow({ sale }) {
  const status = saleStatus(sale);
  const debt = sale.total - sale.paid;
  const percent = sale.total > 0 ? Math.min(100, Math.round((sale.paid / sale.total) * 100)) : 0;

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('efectivo');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async (event) => {
    event.preventDefault();
    const value = Number(amount);
    if (!(value > 0)) {
      setError('Ingresá un monto mayor a 0.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await registerPayment(sale.id, { amount: value, method });
      setOpen(false);
      setAmount('');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="saleitem">
      <div className="saleitem__row">
        <div className="saleitem__info">
          <p className="saleitem__name">
            {sale.kind === 'envio' ? sale.name : `${sale.quantity}× ${sale.name}${sale.variant ? ` (${sale.variant})` : ''}`}
          </p>
          <p className="saleitem__meta">
            {sale.client} · {shortId(sale.id)} · {sale.channel === 'web' ? 'Web' : 'Local'}
            {sale.surcharge > 0 && ` · incluye recargo de tarjeta ${formatPrice(sale.surcharge)}`}
          </p>
        </div>
        <div className="saleitem__bar" role="img" aria-label={`Pagado ${percent}%`}>
          <span style={{ width: `${percent}%` }} className={`bar__fill bar__fill--${status}`} />
        </div>
        <div className="saleitem__amount">
          <strong>
            {formatPrice(sale.paid)} / {formatPrice(sale.total)}
          </strong>
          <span>{debt > 0 ? `Debe ${formatPrice(debt)}` : 'Pagado'}</span>
        </div>
        <StatusBadge status={status} />
      </div>

      {debt > 0 && !open && (
        <button type="button" className="linkbtn saleitem__action" onClick={() => setOpen(true)}>
          Registrar cobro
        </button>
      )}

      {open && (
        <form className="inline-form" onSubmit={handlePay}>
          <input
            className="input"
            type="number"
            min="1"
            max={debt}
            placeholder={`Monto (máx. ${formatPrice(debt)})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Monto cobrado"
          />
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Medio de pago">
            {PAYMENT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn--dark btn--sm" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar cobro'}
          </button>
          <button type="button" className="linkbtn" onClick={() => setOpen(false)}>
            Cancelar
          </button>
        </form>
      )}
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

function PendingOrder({ order }) {
  // Transferencias y tarjeta entran a la cuenta.
  const [method, setMethod] = useState(order.payment ? 'cuenta' : 'efectivo');
  const [paid, setPaid] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const date = toDate(order.createdAt);

  const handleConfirm = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await confirmWebOrder(order.id, { method, paid: paid === '' ? null : Number(paid) });
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar este pedido? No se descontará stock ni se registrará ninguna venta.')) return;
    setBusy(true);
    setError('');
    try {
      await cancelWebOrder(order.id);
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  };

  return (
    <li className="pending">
      <div className="pending__head">
        <div>
          <p className="saleitem__name">
            Pedido {shortId(order.id)} · {order.buyer.name}
          </p>
          <p className="saleitem__meta">
            {date ? formatShortDate(date) : 'Recién llegado'} · {order.buyer.email}
            {order.buyer.phone ? ` · ${order.buyer.phone}` : ''}
          </p>
          <p className="saleitem__meta">
            Entrega: {order.buyer.address}, {order.buyer.city}
            {order.buyer.province ? `, ${order.buyer.province}` : ''}
            {order.buyer.postalCode ? ` (CP ${order.buyer.postalCode})` : ''}
          </p>
          {order.payment && <p className="saleitem__meta">Pago: {getPaymentLabel(order.payment.method)}</p>}
          {order.buyer.notes && <p className="saleitem__meta">Notas: {order.buyer.notes}</p>}
        </div>
        <strong>{formatPrice(order.total)}</strong>
      </div>

      <ul className="pending__items">
        {order.items.map((item, index) => (
          <li key={`${item.id}-${index}`}>
            {item.quantity}× {item.name}
            {item.variant ? ` (${item.variant})` : ''} — {formatPrice(item.subtotal)}
          </li>
        ))}
        {order.surcharge > 0 && <li>Recargo tarjeta (15% sobre productos) — {formatPrice(order.surcharge)}</li>}
        {order.shipping && (
          <li>
            Envío a domicilio ({order.shipping.carrier} a {order.shipping.province}) — {formatPrice(order.shipping.cost)}
          </li>
        )}
      </ul>

      <form className="inline-form" onSubmit={handleConfirm}>
        <input
          className="input"
          type="number"
          min="0"
          max={order.total}
          placeholder="Pagó (vacío = todo)"
          value={paid}
          onChange={(e) => setPaid(e.target.value)}
          aria-label="Monto pagado"
        />
        <select className="input" value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Medio de pago">
          {PAYMENT_METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn--dark btn--sm" disabled={busy}>
          {busy ? 'Procesando…' : 'Confirmar venta'}
        </button>
        <button type="button" className="linkbtn" onClick={handleCancel} disabled={busy}>
          Cancelar pedido
        </button>
      </form>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

export default function SalesTab() {
  const products = useCollection('products');
  const sales = useCollection('sales', { orderField: 'createdAt', max: 500 });
  const orders = useCollection('orders', { orderField: 'createdAt', max: 200 });

  const pendingOrders = useMemo(
    () => orders.data.filter((order) => order.status === 'pendiente'),
    [orders.data]
  );
  const weeks = useMemo(() => groupSalesByWeek(sales.data), [sales.data]);

  const stats = useMemo(() => {
    const counts = { vendido: 0, parcial: 0, deuda: 0 };
    let owed = 0;
    sales.data.forEach((sale) => {
      // Las líneas de envío no cuentan como unidades vendidas, pero sí como saldo a cobrar.
      if (!sale.kind) counts[saleStatus(sale)] += 1;
      owed += Math.max(0, sale.total - sale.paid);
    });
    const available = products.data.reduce((sum, product) => sum + (product.stock ?? 0), 0);
    return { ...counts, owed, available };
  }, [sales.data, products.data]);

  if (products.loading || sales.loading || orders.loading) return <Loader text="Cargando ventas…" />;

  const error = products.error || sales.error || orders.error;
  if (error) return <Message type="error" title="Algo salió mal">{error}</Message>;

  return (
    <>
      <h1 className="page-title">Ventas</h1>

      <div className="stats">
        <Stat dot="disponible" label="Disponible" value={`${stats.available} unid.`} />
        <Stat dot="vendido" label="Vendido" value={stats.vendido} />
        <Stat dot="parcial" label="Venta parcial" value={stats.parcial} />
        <Stat dot="deuda" label="En deuda" value={stats.deuda} />
        <Stat label="Pendiente de cobro" value={formatPrice(stats.owed)} />
        <Stat label="Pedidos web por confirmar" value={pendingOrders.length} />
      </div>

      {pendingOrders.length > 0 && (
        <section className="panel" aria-labelledby="pending-title">
          <h2 id="pending-title" className="panel__title">
            Pedidos web por confirmar
          </h2>
          <p className="panel__hint">
            Al confirmar un pedido se descuenta el stock, se registran las ventas y el cobro en la caja.
          </p>
          <ul className="list">
            {pendingOrders.map((order) => (
              <PendingOrder key={order.id} order={order} />
            ))}
          </ul>
        </section>
      )}

      {weeks.length === 0 ? (
        <Message title="Todavía no hay ventas registradas">
          Las ventas aparecen acá cuando confirmás un pedido de la web o registrás una venta desde Stock.
        </Message>
      ) : (
        weeks.map((week) => (
          <section className="panel" key={week.key} aria-label={`Semana ${week.label}`}>
            <h2 className="panel__title">Semana {week.label}</h2>
            <ul className="list">
              {week.sales.map((sale) => (
                <SaleRow key={sale.id} sale={sale} />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
