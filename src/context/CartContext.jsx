import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'lila-del-alba:cart';

// A partir de esta cantidad de un mismo producto se aplica el precio "x10 U." de la lista.
export const BULK_MIN_QUANTITY = 10;

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Si el navegador no permite guardar, el carrito sigue funcionando en memoria.
    }
  }, [items]);

  // Cada línea del carrito es un producto + una variante (por ejemplo, el aroma elegido).
  const addItem = useCallback((product, quantity, variant = null) => {
    const key = variant ? `${product.id}__${variant}` : product.id;

    setItems((current) => {
      const inCart = current
        .filter((item) => item.id === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      const allowed = Math.max(0, Math.min(quantity, product.stock - inCart));
      if (allowed === 0) return current;

      if (current.some((item) => item.key === key)) {
        return current.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + allowed } : item
        );
      }

      return [
        ...current,
        {
          key,
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          priceX10: product.priceX10 ?? null,
          stock: product.stock,
          variant,
          quantity: allowed,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((key) => {
    setItems((current) => current.filter((item) => item.key !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const quantityByProduct = {};
    items.forEach((item) => {
      quantityByProduct[item.id] = (quantityByProduct[item.id] ?? 0) + item.quantity;
    });

    const pricedItems = items.map((item) => {
      const bulk = item.priceX10 != null && quantityByProduct[item.id] >= BULK_MIN_QUANTITY;
      const unitPrice = bulk ? item.priceX10 : item.price;
      return { ...item, unitPrice, bulk, subtotal: unitPrice * item.quantity };
    });

    return {
      items: pricedItems,
      totalQuantity: pricedItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: pricedItems.reduce((sum, item) => sum + item.subtotal, 0),
      getQuantityInCart: (productId) => quantityByProduct[productId] ?? 0,
      addItem,
      removeItem,
      clearCart,
    };
  }, [items, addItem, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return context;
}
