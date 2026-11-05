// Recargo que se suma al valor de los productos cuando se paga con tarjeta (no se aplica al envío).
export const CARD_SURCHARGE_RATE = 0.15;

export const STORE_PAYMENT_METHODS = [
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'tarjeta', label: 'Tarjeta de crédito (+15%)' },
];

export const SHIPPING_CARRIER = 'Andreani';

// Las 23 provincias y la Ciudad Autónoma de Buenos Aires, en orden alfabético (es lo que ve la clienta).
export const PROVINCES = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
].sort((a, b) => a.localeCompare(b, 'es'));

// Tarifa de Andreani por zona. Todas las provincias tienen tarifa; la zona solo agrupa las que cuestan lo mismo
// (no se muestra a la clienta). Para cambiar un precio o mover una provincia, editá esta lista.
export const SHIPPING_ZONES = [
  {
    id: 'noa',
    label: 'NOA',
    price: 10500,
    provinces: ['Catamarca', 'Jujuy', 'La Rioja', 'Salta', 'Santiago del Estero', 'Tucumán'],
  },
  {
    id: 'centro',
    label: 'Centro',
    price: 13000,
    provinces: [
      'Buenos Aires',
      'CABA',
      'Chaco',
      'Córdoba',
      'Corrientes',
      'Entre Ríos',
      'Formosa',
      'La Pampa',
      'Mendoza',
      'Misiones',
      'San Juan',
      'San Luis',
      'Santa Fe',
    ],
  },
  {
    id: 'patagonia',
    label: 'Patagonia y destinos lejanos',
    price: 17500,
    provinces: ['Chubut', 'Neuquén', 'Río Negro', 'Santa Cruz', 'Tierra del Fuego'],
  },
];

export const SHIPPING_NOTE = '*Solo con envío a domicilio, con entrega estimada de 4 días hábiles.';

export const findZoneByProvince = (province) => SHIPPING_ZONES.find((zone) => zone.provinces.includes(province));

export const getPaymentLabel = (id) => STORE_PAYMENT_METHODS.find((method) => method.id === id)?.label ?? id;
