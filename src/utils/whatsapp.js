import { WHATSAPP_NUMBER } from '../config';
import { formatPrice } from './format';

export function buildOrderMessage({ orderId, buyer, items, totalQuantity, paymentLabel, subtotal, surcharge, shipping, total }) {
  const products = items.map(
    (item) =>
      `• ${item.quantity} × ${item.name}${item.variant ? ` (${item.variant})` : ''} — ${formatPrice(item.subtotal)}`
  );

  return [
    '¡Hola, Lila del Alba! Quiero confirmar mi pedido:',
    '',
    `*Pedido:* ${orderId}`,
    '',
    '*Productos*',
    ...products,
    '',
    `*Unidades:* ${totalQuantity}`,
    `*Subtotal productos:* ${formatPrice(subtotal)}`,
    `*Método de pago:* ${paymentLabel}`,
    ...(surcharge > 0 ? [`*Recargo tarjeta (15% sobre productos):* ${formatPrice(surcharge)}`] : []),
    `*Envío a domicilio (${shipping.carrier} a ${shipping.province}):* ${formatPrice(shipping.cost)}`,
    `*Total a pagar:* ${formatPrice(total)}`,
    '',
    '*Datos de entrega*',
    `Nombre: ${buyer.name}`,
    `Email: ${buyer.email}`,
    `Dirección: ${buyer.address}`,
    `Localidad: ${buyer.city}`,
    `Provincia: ${buyer.province}`,
    `Código postal: ${buyer.postalCode}`,
  ].join('\n');
}

export const buildWhatsAppUrl = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
