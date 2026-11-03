import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getPaymentLabel } from '../data/checkout';
import { normalizePostalCode } from '../data/postalCodes';
import { createOrder } from '../services/orders';
import { buildOrderMessage, buildWhatsAppUrl } from '../utils/whatsapp';

// Guarda la orden en Firestore y abre WhatsApp con el pedido. Lo usan el carrito y el checkout.
export function useOrderSubmit() {
  const { user } = useAuth();
  const {
    items,
    totalQuantity,
    subtotal,
    surcharge,
    shipping,
    total,
    paymentMethod,
    delivery,
    isOrderComplete,
    clearCart,
  } = useCart();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const submit = useCallback(async () => {
    if (saving || !user || !isOrderComplete) return;

    setSaving(true);
    setError('');

    const buyer = {
      name: delivery.name.trim(),
      email: user.email,
      address: delivery.address.trim(),
      city: delivery.city.trim(),
      province: delivery.province,
      postalCode: normalizePostalCode(delivery.postalCode),
    };

    let orderId;
    try {
      orderId = await createOrder({
        user,
        buyer,
        items,
        totalQuantity,
        paymentMethod,
        subtotal,
        surcharge,
        shipping,
        total,
      });
    } catch {
      setError('No pudimos registrar tu compra. Tu carrito sigue intacto, probá de nuevo en unos instantes.');
      setSaving(false);
      return;
    }

    // El carrito se vacía recién cuando Firestore confirmó que la orden se guardó.
    const whatsappUrl = buildWhatsAppUrl(
      buildOrderMessage({
        orderId,
        buyer,
        items,
        totalQuantity,
        paymentLabel: getPaymentLabel(paymentMethod),
        subtotal,
        surcharge,
        shipping,
        total,
      })
    );
    clearCart();
    setConfirmation({ orderId, whatsappUrl });
    setSaving(false);
    // Abre WhatsApp con el pedido listo para enviar (si el navegador lo bloquea, queda el botón).
    window.open(whatsappUrl, '_blank', 'noopener');
  }, [saving, user, isOrderComplete, delivery, items, totalQuantity, paymentMethod, subtotal, surcharge, shipping, total, clearCart]);

  return { submit, saving, error, confirmation };
}
