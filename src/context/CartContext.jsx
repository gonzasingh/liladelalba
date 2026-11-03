import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CARD_SURCHARGE_RATE, findZoneByProvince, PROVINCES, SHIPPING_CARRIER } from '../data/checkout';
import { BULK_MIN_QUANTITY } from '../utils/pricing';
import { getOrderErrors } from '../utils/orderValidation';

const CartContext = createContext(null);

const STORAGE_KEY = 'lila-del-alba:cart';

const EMPTY_DELIVERY = { name: '', postalCode: '', province: '', city: '', address: '' };

const text = (value) => (typeof value === 'string' ? value : '');

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Formato anterior: solo la lista de productos.
    const data = Array.isArray(saved) ? { items: saved } : (saved ?? {});
    const delivery = data.delivery ?? {};
    return {
      items: Array.isArray(data.items) ? data.items : [],
      delivery: {
        name: text(delivery.name),
        postalCode: text(delivery.postalCode),
        province: PROVINCES.includes(delivery.province) ? delivery.province : '',
        city: text(delivery.city),
        address: text(delivery.address),
      },
    };
  } catch {
    return { items: [], delivery: EMPTY_DELIVERY };
  }
}

export function CartProvider({ children }) {
  const [saved] = useState(loadCart);
  const [items, setItems] = useState(saved.items);
  // El método de pago no se guarda: cada vez que se abre la tienda arranca en "Selecciona una opción".
  const [paymentMethod, setPaymentMethodState] = useState(null);
  const [delivery, setDelivery] = useState(saved.delivery);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, delivery }));
    } catch {
      // Si el navegador no permite guardar, el carrito sigue funcionando en memoria.
    }
  }, [items, delivery]);

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

  // Vacía el carrito y también el método de pago y los datos de envío cargados.
  const clearCart = useCallback(() => {
    setItems([]);
    setPaymentMethodState(null);
    setDelivery(EMPTY_DELIVERY);
  }, []);

  const setPaymentMethod = useCallback((method) => setPaymentMethodState(method || null), []);
  const setDeliveryField = useCallback((field, value) => {
    setDelivery((current) => ({ ...current, [field]: value }));
  }, []);

  const value = useMemo(() => {
    const quantityByProduct = {};
    items.forEach((item) => {
      quantityByProduct[item.id] = (quantityByProduct[item.id] ?? 0) + item.quantity;
    });

    const pricedItems = items.map((item) => {
      const bulk = item.priceX10 != null && quantityByProduct[item.id] >= BULK_MIN_QUANTITY;
      const unitPrice = bulk ? item.priceX10 : item.price;
      const subtotal = unitPrice * item.quantity;
      // El recargo de la tarjeta se calcula sobre cada producto, nunca sobre el envío.
      const surcharge = paymentMethod === 'tarjeta' ? Math.round(subtotal * CARD_SURCHARGE_RATE) : 0;
      return { ...item, unitPrice, bulk, subtotal, surcharge };
    });

    const subtotal = pricedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const surcharge = pricedItems.reduce((sum, item) => sum + item.surcharge, 0);
    const zone = findZoneByProvince(delivery.province);
    const shipping =
      items.length > 0 && zone
        ? { carrier: SHIPPING_CARRIER, zone: zone.label, province: delivery.province, cost: zone.price }
        : null;
    const orderErrors = getOrderErrors(delivery, paymentMethod);

    return {
      items: pricedItems,
      totalQuantity: pricedItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      surcharge,
      shipping,
      total: subtotal + surcharge + (shipping?.cost ?? 0),
      paymentMethod,
      delivery,
      orderErrors,
      // Solo se puede finalizar con productos, todos los datos de envío y un método de pago.
      isOrderComplete: items.length > 0 && Object.keys(orderErrors).length === 0,
      setPaymentMethod,
      setDeliveryField,
      getQuantityInCart: (productId) => quantityByProduct[productId] ?? 0,
      addItem,
      removeItem,
      clearCart,
    };
  }, [items, paymentMethod, delivery, setPaymentMethod, setDeliveryField, addItem, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return context;
}
