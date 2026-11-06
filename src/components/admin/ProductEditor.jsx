import { useState } from 'react';
import FragranceDropdown from './FragranceDropdown';
import ProductImage from '../ProductImage';
import { CATEGORIES } from '../../data/categories';
import { useFragrances } from '../../context/FragranceContext';
import { buildOptions, getOtherOptions, getSelectedChoices } from '../../data/fragrances';
import { deleteProduct, describeError, updateProduct } from '../../services/admin';
import { resizeImage } from '../../utils/image';

// Ventana para modificar todos los datos de un producto, cambiar su foto o eliminarlo.
export default function ProductEditor({ product, onClose }) {
  const { fragrances } = useFragrances();
  const [form, setForm] = useState({
    name: product.name ?? '',
    description: product.description ?? '',
    price: String(product.price ?? ''),
    priceX10: product.priceX10 != null ? String(product.priceX10) : '',
    cost: String(product.cost ?? 0),
    stock: String(product.stock ?? 0),
    category: product.category ?? CATEGORIES[0].id,
  });
  const [choices, setChoices] = useState(() => getSelectedChoices(product, fragrances));
  const [image, setImage] = useState(product.image ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const otherOptions = getOtherOptions(product);
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    try {
      setImage(await resizeImage(file));
    } catch {
      setError('No pudimos leer la foto. Probá con otra imagen.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const price = Number(form.price);
    const priceX10 = form.priceX10 === '' ? null : Number(form.priceX10);
    const cost = form.cost === '' ? 0 : Number(form.cost);
    const stock = Number(form.stock);

    if (form.name.trim().length < 2) return setError('Ingresá el nombre del producto.');
    if (!(price > 0)) return setError('Ingresá un precio de venta mayor a 0.');
    if (priceX10 !== null && !(priceX10 > 0)) return setError('El precio por 10 unidades debe ser mayor a 0, o dejarse vacío.');
    if (!(cost >= 0)) return setError('El costo no puede ser negativo.');
    if (!Number.isInteger(stock) || stock < 0) return setError('El stock debe ser un número entero, de 0 o más.');

    setBusy(true);
    try {
      await updateProduct(product.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        priceX10,
        cost,
        stock,
        category: form.category,
        image,
        options: buildOptions(choices, otherOptions, fragrances),
      });
      onClose();
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError('');
    try {
      await deleteProduct(product.id);
      onClose();
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  };

  return (
    <div className="modal" onKeyDown={(event) => event.key === 'Escape' && onClose()}>
      <div className="modal__box" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <h2 id="editor-title" className="panel__title">
          Editar producto
        </h2>

        <form className="editor" onSubmit={handleSubmit}>
          <div className="editor__photo">
            <ProductImage src={image} alt={`Foto de ${product.name}`} />
            <div className="editor__photo-actions">
              <label className="btn btn--ghost btn--sm">
                {image ? 'Reemplazar foto' : 'Agregar foto'}
                <input type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
              </label>
              {image && (
                <button type="button" className="linkbtn" onClick={() => setImage(null)}>
                  Quitar foto
                </button>
              )}
            </div>
          </div>

          <div className="editor__fields">
            <div className="field">
              <label htmlFor="edit-name">Producto</label>
              <input id="edit-name" className="input" value={form.name} onChange={set('name')} autoFocus />
            </div>
            <div className="field">
              <label htmlFor="edit-description">Descripción</label>
              <textarea id="edit-description" className="input" rows="3" value={form.description} onChange={set('description')} />
            </div>
            <div className="editor__grid">
              <div className="field">
                <label htmlFor="edit-price">Precio de venta</label>
                <input id="edit-price" className="input" type="number" min="0" value={form.price} onChange={set('price')} />
              </div>
              <div className="field">
                <label htmlFor="edit-priceX10">Precio por 10 o más (opcional)</label>
                <input id="edit-priceX10" className="input" type="number" min="0" value={form.priceX10} onChange={set('priceX10')} />
              </div>
              <div className="field">
                <label htmlFor="edit-cost">Costo</label>
                <input id="edit-cost" className="input" type="number" min="0" value={form.cost} onChange={set('cost')} />
              </div>
              <div className="field">
                <label htmlFor="edit-stock">Stock</label>
                <input id="edit-stock" className="input" type="number" min="0" value={form.stock} onChange={set('stock')} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="edit-category">Categoría</label>
              <select id="edit-category" className="input" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <span className="editor__label">Fragancias y colores</span>
              <FragranceDropdown selected={choices} onChange={setChoices} ariaLabel="Fragancias y colores del producto" />
              {otherOptions.length > 0 && (
                <span className="field__hint">
                  Se conservan estas opciones: {otherOptions.map((o) => `${o.label} (${o.values.join(', ')})`).join('; ')}.
                </span>
              )}
            </div>
          </div>

          {error && (
            <p className="form__error editor__wide" role="alert">
              {error}
            </p>
          )}

          {confirmingDelete ? (
            <div className="editor__confirm editor__wide" role="alertdialog" aria-labelledby="delete-title">
              <p id="delete-title">
                ¿Eliminar «{product.name}»? Se quita del stock y de la tienda, y no se puede deshacer.
              </p>
              <div className="editor__actions">
                <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={busy}>
                  {busy ? 'Eliminando…' : 'Sí, eliminar'}
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => setConfirmingDelete(false)} disabled={busy}>
                  No, volver
                </button>
              </div>
            </div>
          ) : (
            <div className="editor__actions editor__wide">
              <button type="submit" className="btn btn--dark" disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
                Cancelar
              </button>
              <button type="button" className="linkbtn editor__delete" onClick={() => setConfirmingDelete(true)} disabled={busy}>
                Eliminar producto
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
