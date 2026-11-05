import { useMemo, useState } from 'react';
import FragranceDropdown from './FragranceDropdown';
import ProductEditor from './ProductEditor';
import Loader from '../Loader';
import Message from '../Message';
import { CATEGORIES, getCategory } from '../../data/categories';
import { PAYMENT_METHODS } from '../../data/admin';
import { ALL_CHOICES, buildOptions, getSelectedChoices } from '../../data/fragrances';
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

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="1.6" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

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
  });
  const [choices, setChoices] = useState([]);
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
        image,
        options: buildOptions(choices),
        order: nextOrder,
      });
      setDone(`"${form.name.trim()}" se agregó al stock y ya se ve en la tienda.`);
      setForm((current) => ({ ...current, name: '', description: '', price: '', cost: '', quantity: '' }));
      setChoices([]);
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
        <div className="inline-form__break" />
        <div className="inline-form__dropdown">
          <FragranceDropdown selected={choices} onChange={setChoices} ariaLabel="Fragancias y colores" />
        </div>
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

function StockRow({ product, reserved, onEdit }) {
  const [error, setError] = useState('');
  const category = getCategory(product.category);

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
        <button type="button" className="iconbtn" onClick={() => onEdit(product.id)} aria-label={`Editar ${product.name}`}>
          <PencilIcon />
        </button>
      </td>
      <td>
        <strong>{product.name}</strong>
        {error && <small className="field__error"> {error}</small>}
      </td>
      <td>{category?.short ?? product.category}</td>
      <td>
        <FragranceDropdown readOnly selected={getSelectedChoices(product)} ariaLabel={`Fragancias y colores de ${product.name}`} />
      </td>
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
            className="roundbtn"
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
            className="roundbtn"
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

  const [choice, setChoice] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [editingId, setEditingId] = useState(null);
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

  // Valor de todo el stock: a lo que costó y a lo que se vende.
  const stockValue = useMemo(
    () => ({
      cost: products.data.reduce((sum, p) => sum + (p.cost ?? 0) * (p.stock ?? 0), 0),
      sale: products.data.reduce((sum, p) => sum + (p.price ?? 0) * (p.stock ?? 0), 0),
    }),
    [products.data]
  );

  const visible = useMemo(
    () =>
      products.data.filter((product) => {
        if (choice && !getSelectedChoices(product).includes(choice)) return false;
        if (category && product.category !== category) return false;
        if (status === 'disponible' && !(product.stock > 0)) return false;
        if (status === 'sin-stock' && product.stock > 0) return false;
        return true;
      }),
    [products.data, choice, category, status]
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
  // Si el producto se elimina, la ventana de edición se cierra sola.
  const editing = products.data.find((p) => p.id === editingId);

  return (
    <>
      <h1 className="page-title">Stock</h1>

      <div className="stats stats--two">
        <div className="stat">
          <p className="stat__label">Stock Valor a costo</p>
          <p className="stat__value">{formatPrice(stockValue.cost)}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Stock Valor de venta</p>
          <p className="stat__value">{formatPrice(stockValue.sale)}</p>
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
          <select className="input" value={choice} onChange={(e) => setChoice(e.target.value)} aria-label="Filtrar por fragancia o color">
            <option value="">Todas las fragancias</option>
            {ALL_CHOICES.map((name) => (
              <option key={name} value={name}>
                {name}
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
          <span className="muted inline-form__count">
            {visible.length} de {products.data.length} productos
          </span>
        </div>

        {visible.length > 0 && (
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <span className="sr-only">Editar</span>
                    <ImageIcon />
                  </th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Fragancias</th>
                  <th>Costo</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <StockRow key={product.id} product={product} reserved={reservedById[product.id] ?? 0} onEdit={setEditingId} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && <ProductEditor key={editing.id} product={editing} onClose={() => setEditingId(null)} />}
    </>
  );
}
