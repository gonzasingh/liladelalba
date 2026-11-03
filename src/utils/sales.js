import { getWeekRange, toDate, weekKey } from './weeks';

export const STATUS_LABELS = { vendido: 'Vendido', parcial: 'Venta parcial', deuda: 'En deuda' };

export const saleStatus = (sale) => (sale.paid >= sale.total ? 'vendido' : sale.paid > 0 ? 'parcial' : 'deuda');

// Agrupa las ventas por semana (la más reciente primero). Las ventas llegan ordenadas de nuevas a viejas.
export function groupSalesByWeek(sales) {
  const groups = new Map();
  sales.forEach((sale) => {
    const date = toDate(sale.createdAt) ?? new Date();
    const key = weekKey(date);
    if (!groups.has(key)) groups.set(key, { key, label: getWeekRange(date), sales: [] });
    groups.get(key).sales.push(sale);
  });
  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
}
