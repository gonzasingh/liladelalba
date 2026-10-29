export const CATEGORIES = [
  { id: 'hogar', short: 'Hogar', label: 'Aromas para el hogar' },
  { id: 'jabones', short: 'Jabones', label: 'Jabones exfoliantes' },
  { id: 'cremas', short: 'Cremas', label: 'Cremas corporales' },
  { id: 'aceites', short: 'Aceites', label: 'Aceites corporales' },
  { id: 'serum', short: 'Sérum', label: 'Sérum hidratante' },
  { id: 'balsamo', short: 'Bálsamo labial', label: 'Bálsamo labial' },
  { id: 'ducha', short: 'Ducha', label: 'Ducha cuerpo y cabello' },
];

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id);
