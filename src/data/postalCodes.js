// Reglas para comprobar que el código postal pertenece a la provincia elegida.
// "letter" es la letra inicial del CPA (código postal argentino, por ejemplo T4000ABC) y "ranges" son los
// rangos del código numérico de 4 cifras. En los límites entre provincias hay códigos compartidos o muy
// cercanos, por eso los rangos son algo amplios: detectan errores claros (4000 con Mendoza) sin bloquear
// localidades de frontera. Si una clienta legítima queda bloqueada, ampliá el rango de su provincia acá.
export const POSTAL_RULES = {
  'Buenos Aires': { letter: 'B', ranges: [[1500, 1999], [2700, 2999], [6000, 8199], [8500, 8509]] },
  CABA: { letter: 'C', ranges: [[1000, 1499]] },
  Catamarca: { letter: 'K', ranges: [[4130, 4149], [4700, 4799], [5340, 5349]] },
  Chaco: { letter: 'H', ranges: [[3500, 3549], [3700, 3799]] },
  Chubut: { letter: 'U', ranges: [[9000, 9299]] },
  Córdoba: { letter: 'X', ranges: [[2400, 2699], [5000, 5299], [5800, 5999], [6100, 6299]] },
  Corrientes: { letter: 'W', ranges: [[3190, 3199], [3220, 3239], [3300, 3499]] },
  'Entre Ríos': { letter: 'E', ranges: [[2800, 2899], [3100, 3299]] },
  Formosa: { letter: 'P', ranges: [[3600, 3699]] },
  Jujuy: { letter: 'Y', ranges: [[4500, 4699]] },
  'La Pampa': { letter: 'L', ranges: [[6200, 6399], [8200, 8299]] },
  'La Rioja': { letter: 'F', ranges: [[5300, 5399]] },
  Mendoza: { letter: 'M', ranges: [[5500, 5699]] },
  Misiones: { letter: 'N', ranges: [[3300, 3399], [3570, 3589]] },
  Neuquén: { letter: 'Q', ranges: [[8300, 8399], [8407, 8409]] },
  'Río Negro': { letter: 'R', ranges: [[8300, 8599]] },
  Salta: { letter: 'A', ranges: [[4190, 4199], [4400, 4599]] },
  'San Juan': { letter: 'J', ranges: [[5400, 5499]] },
  'San Luis': { letter: 'D', ranges: [[5700, 5899]] },
  'Santa Cruz': { letter: 'Z', ranges: [[9000, 9099], [9300, 9409]] },
  'Santa Fe': { letter: 'S', ranges: [[2000, 2699], [2900, 2929], [3000, 3099], [3550, 3599], [6100, 6119]] },
  'Santiago del Estero': { letter: 'G', ranges: [[3730, 3789], [4200, 4399]] },
  'Tierra del Fuego': { letter: 'V', ranges: [[9410, 9499]] },
  Tucumán: { letter: 'T', ranges: [[4000, 4199]] },
};

// "t 4000-abc" → "T4000ABC"
export const normalizePostalCode = (value) => String(value ?? '').replace(/[\s-]/g, '').toUpperCase();

// Acepta el código de 4 números (4000), con letra (T4000) o el CPA completo (T4000ABC).
export function parsePostalCode(value) {
  const match = /^([A-Z])?(\d{4})([A-Z]{3})?$/.exec(normalizePostalCode(value));
  return match ? { letter: match[1] ?? null, number: Number(match[2]) } : null;
}

export function postalCodeMatchesProvince(value, province) {
  const parsed = parsePostalCode(value);
  const rule = POSTAL_RULES[province];
  if (!parsed || !rule) return false;
  if (parsed.letter && parsed.letter !== rule.letter) return false;
  return rule.ranges.some(([min, max]) => parsed.number >= min && parsed.number <= max);
}
