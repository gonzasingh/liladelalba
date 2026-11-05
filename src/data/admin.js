export const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'cuenta', label: 'Cuenta (transferencias y tarjeta)' },
];

// Destinos posibles para los egresos de la caja. Editá esta lista para cambiarlos.
export const EXPENSE_DESTINATIONS = ['Reinversión', 'Gastos del negocio', 'Retiro personal'];

export const getMethodLabel = (id) => PAYMENT_METHODS.find((method) => method.id === id)?.label ?? id;
