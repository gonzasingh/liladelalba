const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export const formatPrice = (value) => money.format(value);

// Compara textos sin importar mayúsculas ni tildes ("serum" encuentra "Sérum").
export const normalizeText = (text) =>
  String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
