import { useMemo, useState } from 'react';
import Loader from '../Loader';
import Message from '../Message';
import { CATEGORIES, getCategory } from '../../data/categories';
import { getLotLabel, LOTS, PAYMENT_METHODS } from '../../data/admin';
import { INITIAL_PRODUCTS } from '../../data/initialProducts';
import { useCollection } from '../../hooks/useCollection';
import {
  addProduct,
  changeStock,
  describeError,
  loadInitialCatalog,
  registerOfflineSale,
  updateProduct,
} from '../../services/admin';
import { formatPrice, shortId } from '../../utils/format';
import { resizeImage } from '../../utils/image';
import { unitPriceFor } from '../../utils/pricing';
import { getWeekRange, toDate } from '../../utils/weeks';

const lotOf = (product) => product.lot ?? 'viejo';

function OfflineSaleForm({ products }) {
  const [productId, setProductId] = useState('');
  const [selected, setSelected] = useState({});
  const [quantity, setQuantity] = useState('1');
  const [client, setClient] = useState('');
  const [method, setMethod] = useState('efectivo');
  const [paid, setPaid] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const sellable = products.filter((product) => product.stock > 0);
  const product = products.find((p) => p.id === productId);
  const options = product?.options ?? [];
  const qty = Number(quantity);
  const total = product && qty > 0 ? unitPriceFor(product, qty) * qty : 0;

  const handleProductChange = (id) => {
    setProductId(id);
    setSelected({});
    setDone('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setDone('');
    setError('');

    if (!product) return setError('Elegí el producto vendido.');
    if (!options.every((option) => selected[option.label])) return setError('Elegí todas las opciones del producto.');
    if (!Number.isInteger(qty) || qty < 1 || qty > product.stock) {
      return setError(`La cantidad debe estar entre 1 y ${product.stock}.`);
    }
    if (paid !== '' && (Number(paid) < 0 || Number(paid) > total)) {
      return setError(`El pago debe estar entre $ 0 y ${formatPrice(total)}.`);
    }

    setBusy(true);
    try {
      const saleId = await registerOfflineSale({
        productId: product.id,
        variant: options.length ? options.map((option) => selected[option.label]).join(' · ') : null,
        quantity: qty,
        client: client.trim(),
        method,
        paid: paid === '' ? null : Number(paid),
      });
      setDone(`Venta ${shortId(saleId)} registrada por ${formatPrice(total)}.`);
      setProductId('');
      setSelected({});
      setQuantity('1');
      setClient('');
      setPaid('');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="offline-title">
      <h2 id="offline-title" className="panel__title">
        Venta fuera de la web
      </h2>
      <p className="panel__hint">Descuenta el stock online y queda registrada en Ventas.</p>
      <form className="inline-form" onSubmit={handleSubmit}>
        <select
          className="input input--wide"
          value={productId}
          onChange={(e) => handleProductChange(e.target.value)}
          aria-label="Producto vendido"
        >
          <option value="">Producto vendido…</option>
          {sellable.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · stock {p.stock}
            </option>
          ))}
        </select>
        {options.map((option) => (
          <select
            key={option.label}
            className="input"
            value={selected[option.label] ?? ''}
            onChange={(e) => setSelected((current) => ({ ...current, [option.label]: e.target.value }))}
            aria-label={option.label}
          >
            <option value="">{option.label}…</option>
            {option.values.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        ))}
        <input
          className="input input--narrow"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          aria-label="Cantidad"
        />
        <input className="input" placeholder="Cliente" value={client} onChange={(e) => setClient(e.target.value)} aria-label="Cliente" />
        <select className="input" value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Medio de pago">
          {PAYMENT_METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="number"
          min="0"
          placeholder="Pagó (vacío = todo)"
          value={paid}
          onChange={(e) => setPaid(e.target.value)}
          aria-label="Monto pagado"
        />
        <button type="submit" className="btn btn--dark" disabled={busy}>
          {busy ? 'Registrando…' : 'Registrar venta'}
        </button>
      </form>
      {total > 0 && <p className="panel__hint">Total de la venta: {formatPrice(total)}</p>}
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="message message--success" role="status">
          {done}
        </p>
      )}
    </section>
  );
}

function AddProductForm({ nextOrder }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    quantity: '',
    category: CATEGORIES[0].id,
    lot: 'nuevo',
  });
  const [photo, setPhoto] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setDone('');

    const price = Number(form.price);
    const cost = form.cost === '' ? 0 : Number(form.cost);
    const stock = Number(form.quantity);
    if (form.name.trim().length < 2) return setError('Ingresá el nombre del producto.');
    if (!(price > 0)) return setError('Ingresá un precio de venta mayor a 0.');
    if (!(cost >= 0)) return setError('El costo no puede ser negativo.');
    if (!Number.isInteger(stock) || stock < 0) return setError('Ingresá la cantidad inicial (0 o más).');

    setBusy(true);
    let image = getCategory(form.category).image;
    if (photo) {
      try {
        image = await resizeImage(photo);
      } catch {
        setError('No pudimos leer la foto. Probá con otra imagen.');
        setBusy(false);
        return;
      }
    }

    try {
      await addProduct({
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        cost,
        stock,
        category: form.category,
        lot: form.lot,
        image,
        order: nextOrder,
      });
      setDone(`"${form.name.trim()}" se agregó al stock y ya se ve en la tienda.`);
      setForm((current) => ({ ...current, name: '', description: '', price: '', cost: '', quantity: '' }));
      setPhoto(null);
      setFileKey((key) => key + 1);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="add-title">
      <h2 id="add-title" className="panel__title">
        Agregar al stock
      </h2>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input className="input" placeholder="Producto" value={form.name} onChange={set('name')} aria-label="Producto" />
        <input className="input input--wide" placeholder="Descripción (opcional)" value={form.description} onChange={set('description')} aria-label="Descripción" />
        <input className="input" type="number" min="0" placeholder="Precio venta" value={form.price} onChange={set('price')} aria-label="Precio de venta" />
        <input className="input" type="number" min="0" placeholder="Costo" value={form.cost} onChange={set('cost')} aria-label="Costo" />
        <input className="input" type="number" min="0" placeholder="Cantidad" value={form.quantity} onChange={set('quantity')} aria-label="Cantidad" />
        <select className="input" value={form.category} onChange={set('category')} aria-label="Categoría">
          {CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        <select className="input" value={form.lot} onChange={set('lot')} aria-label="Lote">
          {LOTS.map((lot) => (
            <option key={lot.id} value={lot.id}>
              {lot.label}
            </option>
          ))}
        </select>
        <label className="filefield">
          Foto
          <input key={fileKey} type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </label>
        <button type="submit" className="btn btn--dark" disabled={busy}>
          {busy ? 'Agregando…' : 'Agregar'}
        </button>
      </form>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="message message--success" role="status">
          {done}
        </p>
      )}
    </section>
  );
}

function StockRow({ product, reserved }) {
  const [error, setError] = useState('');
  const category = getCategory(product.category);
  const addedAt = toDate(product.addedAt);

  const save = async (action) => {
    setError('');
    try {
      await action();
    } catch (err) {
      setError(describeError(err));
    }
  };

  // Guarda un número al salir del campo, solo si cambió y es válido.
  const handleBlur = (field) => (event) => {
    const value = Number(event.target.value);
    const current = product[field] ?? 0;
    if (event.target.value === '' || !Number.isFinite(value) || value < 0) {
      event.target.value = current;
      return;
    }
    const next = field === 'stock' ? Math.floor(value) : value;
    if (next !== current) save(() => updateProduct(product.id, { [field]: next }));
  };

  const soldOut = (product.stock ?? 0) <= 0;

  return (
    <tr>
      <td>
        <strong>{product.name}</strong>
        {error && <small className="field__error"> {error}</small>}
      </td>
      <td>{category?.short ?? product.category}</td>
      <td>{getLotLabel(product.lot)}</td>
      <td>{addedAt ? getWeekRange(addedAt) : '—'}</td>
      <td>
        <input
          className="input input--cell"
          type="number"
          min="0"
          defaultValue={product.cost ?? 0}
          key={`cost-${product.cost}`}
          onBlur={handleBlur('cost')}
          aria-label={`Costo de ${product.name}`}
        />
      </td>
      <td>
        <input
          className="input input--cell"
          type="number"
          min="0"
          defaultValue={product.price}
          key={`price-${product.price}`}
          onBlur={handleBlur('price')}
          aria-label={`Precio de ${product.name}`}
        />
      </td>
      <td>
        <span className="badge">
          <span className={`dot dot--${soldOut ? 'deuda' : 'disponible'}`} aria-hidden="true" />
          {soldOut ? 'Sin stock' : 'Disponible'}
        </span>
        {reserved > 0 && <small className="muted"> Pedidos web: {reserved}</small>}
      </td>
      <td>
        <div className="stepper">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={soldOut}
            onClick={() => save(() => changeStock(product.id, -1))}
            aria-label={`Restar una unidad de ${product.name}`}
          >
            −
          </button>
          <input
            className="input input--cell input--narrow"
            type="number"
            min="0"
            defaultValue={product.stock ?? 0}
            key={`stock-${product.stock}`}
            onBlur={handleBlur('stock')}
            aria-label={`Stock de ${product.name}`}
          />
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => save(() => changeStock(product.id, 1))}
            aria-label={`Sumar una unidad de ${product.name}`}
          >
            +
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function StockTab() {
  const products = useCollection('products');
  const orders = useCollection('orders', { orderField: 'createdAt', max: 200 });

  const [lot, setLot] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState('');

  const reservedById = useMemo(() => {
    const reserved = {};
    orders.data
      .filter((order) => order.status === 'pendiente')
      .forEach((order) =>
        order.items.forEach((item) => {
          reserved[item.id] = (reserved[item.id] ?? 0) + item.quantity;
        })
      );
    return reserved;
  }, [orders.data]);

  const valueByLot = useMemo(() => {
    const totals = { viejo: 0, nuevo: 0 };
    products.data.forEach((product) => {
      totals[lotOf(product)] += (product.cost ?? 0) * (product.stock ?? 0);
    });
    return totals;
  }, [products.data]);

  const visible = useMemo(
    () =>
      products.data.filter((product) => {
        if (lot && lotOf(product) !== lot) return false;
        if (category && product.category !== category) return false;
        if (status === 'disponible' && !(product.stock > 0)) return false;
        if (status === 'sin-stock' && product.stock > 0) return false;
        if (minPrice !== '' && product.price < Number(minPrice)) return false;
        if (maxPrice !== '' && product.price > Number(maxPrice)) return false;
        return true;
      }),
    [products.data, lot, category, status, minPrice, maxPrice]
  );

  const handleLoadCatalog = async () => {
    setLoadingCatalog(true);
    setCatalogError('');
    try {
      await loadInitialCatalog(INITIAL_PRODUCTS, products.data.map((p) => p.id));
    } catch (err) {
      setCatalogError(describeError(err));
    } finally {
      setLoadingCatalog(false);
    }
  };

  if (products.loading || orders.loading) return <Loader text="Cargando stock…" />;

  const error = products.error || orders.error;
  if (error) return <Message type="error" title="Algo salió mal">{error}</Message>;

  const nextOrder = Math.max(0, ...products.data.map((p) => p.order ?? 0)) + 1;

  return (
    <>
      <h1 className="page-title">Stock</h1>

      <div className="stats stats--two">
        <div className="stat">
          <p className="stat__label">Stock viejo, valor a costo</p>
          <p className="stat__value">{formatPrice(valueByLot.viejo)}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Ingreso nuevo, valor a costo</p>
          <p className="stat__value">{formatPrice(valueByLot.nuevo)}</p>
        </div>
      </div>

      {products.data.length === 0 && (
        <Message
          title="Todavía no hay productos cargados"
          action={
            <button type="button" className="btn btn--dark" onClick={handleLoadCatalog} disabled={loadingCatalog}>
              {loadingCatalog ? 'Cargando…' : `Cargar el catálogo inicial (${INITIAL_PRODUCTS.length} productos)`}
            </button>
          }
        >
          {catalogError || 'Podés cargar los productos de las listas de precios de Lila del Alba o ir agregándolos uno por uno.'}
        </Message>
      )}

      <OfflineSaleForm products={products.data} />
      <AddProductForm nextOrder={nextOrder} />

      <section className="panel" aria-label="Productos en stock">
        <div className="inline-form">
          <select className="input" value={lot} onChange={(e) => setLot(e.target.value)} aria-label="Filtrar por lote">
            <option value="">Todos los lotes</option>
            {LOTS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filtrar por categoría">
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="sin-stock">Sin stock</option>
          </select>
          <input className="input" type="number" min="0" placeholder="Precio mín." value={minPrice} onChange={(e) => setMinPrice(e.target.value)} aria-label="Precio mínimo" />
          <input className="input" type="number" min="0" placeholder="Precio máx." value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} aria-label="Precio máximo" />
          <span className="muted">
            {visible.length} de {products.data.length} productos
          </span>
        </div>

        {visible.length > 0 && (
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Lote</th>
                  <th>Semana</th>
                  <th>Costo</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <StockRow key={product.id} product={product} reserved={reservedById[product.id] ?? 0} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
