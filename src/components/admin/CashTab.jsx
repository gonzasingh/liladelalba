import { useMemo, useState } from 'react';
import Loader from '../Loader';
import Message from '../Message';
import { EXPENSE_DESTINATIONS, getMethodLabel, PAYMENT_METHODS } from '../../data/admin';
import { useCollection } from '../../hooks/useCollection';
import { addMovement, deleteMovement, describeError, saveCashCount } from '../../services/admin';
import { formatPrice } from '../../utils/format';
import { formatDateTime, toDate } from '../../utils/weeks';

function CountRow({ label, field, expected, real }) {
  const [error, setError] = useState('');
  const counted = typeof real === 'number';
  const difference = counted ? real - expected : 0;

  const handleBlur = async (event) => {
    const raw = event.target.value;
    const value = Number(raw);
    if (raw === '' || !Number.isFinite(value) || value < 0) {
      event.target.value = counted ? real : '';
      return;
    }
    if (counted && value === real) return;
    setError('');
    try {
      await saveCashCount({ [field]: value });
    } catch (err) {
      setError(describeError(err));
    }
  };

  let badge = 'Sin contar';
  let tone = 'pendiente';
  if (counted) {
    if (difference === 0) {
      badge = 'Cuadra';
      tone = 'vendido';
    } else {
      badge = difference > 0 ? 'Sobra' : 'Falta';
      tone = 'deuda';
    }
  }

  return (
    <tr>
      <td>{label}</td>
      <td className="num">{formatPrice(expected)}</td>
      <td>
        <input
          className="input input--cell"
          type="number"
          min="0"
          placeholder="Lo que hay"
          defaultValue={counted ? real : ''}
          key={`${field}-${real}`}
          onBlur={handleBlur}
          aria-label={`${label}: monto real`}
        />
        {error && <small className="field__error"> {error}</small>}
      </td>
      <td>
        <span className="badge">
          <span className={`dot dot--${tone}`} aria-hidden="true" />
          {badge}
        </span>{' '}
        <strong>{formatPrice(Math.abs(difference))}</strong>
      </td>
    </tr>
  );
}

function MovementForm() {
  const [form, setForm] = useState({
    type: 'egreso',
    amount: '',
    method: 'efectivo',
    destination: EXPENSE_DESTINATIONS[0],
    detail: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const amount = Number(form.amount);
    if (!(amount > 0)) {
      setError('Ingresá un monto mayor a 0.');
      return;
    }

    setBusy(true);
    try {
      await addMovement({
        type: form.type,
        method: form.method,
        amount,
        destination: form.type === 'egreso' ? form.destination : 'Ingreso manual',
        detail: form.detail.trim(),
      });
      setForm((current) => ({ ...current, amount: '', detail: '' }));
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="movement-title">
      <h2 id="movement-title" className="panel__title">
        Registrar movimiento
      </h2>
      <form className="inline-form" onSubmit={handleSubmit}>
        <select className="input" value={form.type} onChange={set('type')} aria-label="Tipo de movimiento">
          <option value="egreso">Egreso</option>
          <option value="ingreso">Ingreso</option>
        </select>
        <input className="input" type="number" min="0" placeholder="Monto" value={form.amount} onChange={set('amount')} aria-label="Monto" />
        <select className="input" value={form.method} onChange={set('method')} aria-label="Medio de pago">
          {PAYMENT_METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        {form.type === 'egreso' && (
          <select className="input" value={form.destination} onChange={set('destination')} aria-label="Destino del egreso">
            {EXPENSE_DESTINATIONS.map((destination) => (
              <option key={destination} value={destination}>
                {destination}
              </option>
            ))}
          </select>
        )}
        <input className="input input--wide" placeholder="Detalle" value={form.detail} onChange={set('detail')} aria-label="Detalle" />
        <button type="submit" className="btn btn--dark" disabled={busy}>
          {busy ? 'Registrando…' : 'Registrar'}
        </button>
      </form>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function MovementRow({ movement }) {
  const [error, setError] = useState('');
  const date = toDate(movement.createdAt);
  const isIncome = movement.type === 'ingreso';

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este movimiento de la caja?')) return;
    setError('');
    try {
      await deleteMovement(movement.id);
    } catch (err) {
      setError(describeError(err));
    }
  };

  return (
    <tr>
      <td>{date ? formatDateTime(date) : '—'}</td>
      <td>{isIncome ? 'Ingreso' : 'Egreso'}</td>
      <td>{getMethodLabel(movement.method)}</td>
      <td>{movement.destination}</td>
      <td>{movement.detail || '—'}</td>
      <td className={`num ${isIncome ? 'is-income' : 'is-expense'}`}>
        {isIncome ? '+' : '−'} {formatPrice(movement.amount)}
      </td>
      <td>
        {movement.saleId ? (
          <span className="muted">De una venta</span>
        ) : (
          <button type="button" className="linkbtn" onClick={handleDelete} aria-label={`Eliminar movimiento de ${formatPrice(movement.amount)}`}>
            Eliminar
          </button>
        )}
        {error && <small className="field__error"> {error}</small>}
      </td>
    </tr>
  );
}

export default function CashTab() {
  const movements = useCollection('movements', { orderField: 'createdAt', max: 500 });
  const sales = useCollection('sales', { orderField: 'createdAt', max: 500 });
  const settings = useCollection('settings');

  const summary = useMemo(() => {
    const balance = { efectivo: 0, cuenta: 0 };
    const byDestination = {};
    movements.data.forEach((movement) => {
      const sign = movement.type === 'ingreso' ? 1 : -1;
      balance[movement.method] = (balance[movement.method] ?? 0) + sign * movement.amount;
      if (movement.type === 'egreso') {
        byDestination[movement.destination] = (byDestination[movement.destination] ?? 0) + movement.amount;
      }
    });
    const owed = sales.data.reduce((sum, sale) => sum + Math.max(0, sale.total - sale.paid), 0);
    return { balance, byDestination, owed };
  }, [movements.data, sales.data]);

  if (movements.loading || sales.loading || settings.loading) return <Loader text="Cargando la caja…" />;

  const error = movements.error || sales.error || settings.error;
  if (error) return <Message type="error" title="Algo salió mal">{error}</Message>;

  const count = settings.data.find((item) => item.id === 'cashCount') ?? {};

  return (
    <>
      <h1 className="page-title">Caja</h1>

      <section className="panel" aria-label="Arqueo de caja">
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th />
                <th>Debería tener</th>
                <th>Tiene (real)</th>
                <th>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              <CountRow label="Efectivo" field="cash" expected={summary.balance.efectivo} real={count.cash} />
              <CountRow label="Cuenta (transferencias y tarjeta)" field="account" expected={summary.balance.cuenta} real={count.account} />
            </tbody>
          </table>
        </div>
        <p className="panel__hint">
          Suma los cobros de ventas y los movimientos que registres. Pendiente de cobro por ventas:{' '}
          {formatPrice(summary.owed)}.
        </p>
      </section>

      <h2 className="panel__title panel__title--lg">Egresos por destino</h2>
      <div className="stats">
        {EXPENSE_DESTINATIONS.map((destination) => (
          <div className="stat" key={destination}>
            <p className="stat__label">{destination}</p>
            <p className="stat__value">{formatPrice(summary.byDestination[destination] ?? 0)}</p>
          </div>
        ))}
      </div>

      <MovementForm />

      <section className="panel" aria-label="Movimientos">
        <h2 className="panel__title">Movimientos</h2>
        {movements.data.length === 0 ? (
          <p className="panel__hint">Todavía no hay movimientos. Los cobros de ventas aparecen acá automáticamente.</p>
        ) : (
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Medio</th>
                  <th>Destino</th>
                  <th>Detalle</th>
                  <th>Monto</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {movements.data.map((movement) => (
                  <MovementRow key={movement.id} movement={movement} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
