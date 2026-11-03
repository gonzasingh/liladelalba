import { findZoneByProvince, PROVINCES } from '../data/checkout';
import { normalizePostalCode, parsePostalCode, postalCodeMatchesProvince } from '../data/postalCodes';

// Devuelve un objeto con un mensaje por cada dato que falta o es inválido. Vacío = pedido completo.
export function getOrderErrors(delivery, paymentMethod) {
  const errors = {};
  const provinceChosen = PROVINCES.includes(delivery.province);

  if (delivery.name.trim().length < 3) errors.name = 'Ingresá tu nombre y apellido.';

  if (!parsePostalCode(delivery.postalCode)) {
    errors.postalCode = 'Ingresá un código postal válido, de 4 números (por ejemplo 4000).';
  } else if (provinceChosen && !postalCodeMatchesProvince(delivery.postalCode, delivery.province)) {
    errors.postalCode = `El código postal ${normalizePostalCode(delivery.postalCode)} no corresponde a ${delivery.province}.`;
  }

  if (!provinceChosen) errors.province = 'Elegí una provincia.';
  else if (!findZoneByProvince(delivery.province)) errors.province = 'Todavía no tenemos tarifa de envío para esta provincia.';

  if (delivery.city.trim().length < 2) errors.city = 'Ingresá tu localidad.';
  if (delivery.address.trim().length < 4) errors.address = 'Ingresá calle, número y piso o depto.';
  if (!paymentMethod) errors.paymentMethod = 'Elegí un método de pago.';
  return errors;
}
