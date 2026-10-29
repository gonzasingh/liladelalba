import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Hero from './Hero';
import ItemList from './ItemList';
import Loader from './Loader';
import Message from './Message';
import { getCategory } from '../data/categories';
import { getProducts } from '../services/products';
import { normalizeText } from '../utils/format';

function Catalog({ categoryId }) {
  const category = categoryId ? getCategory(categoryId) : null;
  const unknownCategory = Boolean(categoryId) && !category;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(!unknownCategory);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');

  useEffect(() => {
    if (unknownCategory) return undefined;

    let active = true;
    setLoading(true);
    setError('');

    getProducts(categoryId)
      .then((data) => active && setProducts(data))
      .catch(() => active && setError('No pudimos cargar los productos. Revisá tu conexión y probá de nuevo.'))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [categoryId, unknownCategory, attempt]);

  const visibleProducts = useMemo(() => {
    const term = normalizeText(search.trim());
    const list = term
      ? products.filter((p) => normalizeText(`${p.name} ${p.description}`).includes(term))
      : [...products];

    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, search, sort]);

  if (unknownCategory) {
    return (
      <Message
        title="Esa categoría no existe"
        action={
          <Link className="btn btn--dark" to="/">
            Ver todos los productos
          </Link>
        }
      >
        Elegí una de las categorías del menú para seguir comprando.
      </Message>
    );
  }

  let content;
  if (loading) {
    content = <Loader text="Cargando productos…" />;
  } else if (error) {
    content = (
      <Message
        type="error"
        title="Algo salió mal"
        action={
          <button type="button" className="btn btn--dark" onClick={() => setAttempt((n) => n + 1)}>
            Reintentar
          </button>
        }
      >
        {error}
      </Message>
    );
  } else if (products.length === 0) {
    content = (
      <Message
        title="Todavía no hay productos en esta categoría"
        action={
          <Link className="btn btn--dark" to="/">
            Ver todos los productos
          </Link>
        }
      >
        Estamos sumando novedades. Mientras tanto, mirá el resto del catálogo.
      </Message>
    );
  } else if (visibleProducts.length === 0) {
    content = (
      <Message
        title="No encontramos resultados"
        action={
          <button type="button" className="btn btn--dark" onClick={() => setSearch('')}>
            Limpiar búsqueda
          </button>
        }
      >
        {`No hay productos que coincidan con “${search.trim()}”.`}
      </Message>
    );
  } else {
    content = <ItemList products={visibleProducts} />;
  }

  const showToolbar = !loading && !error && products.length > 0;

  return (
    <>
      {!category && <Hero />}

      <section id="catalogo" className="catalog" aria-labelledby="catalog-title">
        <div className="catalog__head">
          <div>
            <h2 id="catalog-title" className="catalog__title">
              {category ? category.label : 'Todos los productos'}
            </h2>
            {showToolbar && (
              <p className="catalog__count">
                {visibleProducts.length} {visibleProducts.length === 1 ? 'producto' : 'productos'}
              </p>
            )}
          </div>

          {showToolbar && (
            <div className="toolbar">
              <label className="toolbar__field">
                <span className="sr-only">Buscar productos</span>
                <input
                  className="input"
                  type="search"
                  placeholder="Buscar un producto"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <label className="toolbar__field">
                <span className="sr-only">Ordenar por</span>
                <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="featured">Orden de la lista</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                </select>
              </label>
            </div>
          )}
        </div>

        {content}
      </section>
    </>
  );
}

// "key" reinicia la búsqueda y el orden cada vez que cambia la categoría.
export default function ItemListContainer() {
  const { categoryId } = useParams();
  return <Catalog key={categoryId ?? 'todos'} categoryId={categoryId} />;
}
