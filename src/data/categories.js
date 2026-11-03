export const CATEGORIES = [
  { id: 'hogar', image: '/img/hogar.webp', short: 'Hogar', label: 'Aromas para el hogar' },
  { id: 'jabones', image: '/img/jabones.webp', short: 'Jabones', label: 'Jabones exfoliantes' },
  { id: 'cremas', image: '/img/cremas.webp', short: 'Cremas', label: 'Cremas corporales' },
  { id: 'aceites', image: '/img/aceites.webp', short: 'Aceites', label: 'Aceites corporales' },
  { id: 'serum', image: '/img/serum.webp', short: 'Sérum', label: 'Sérum hidratante' },
  { id: 'balsamo', image: '/img/serum.webp', short: 'Bálsamo labial', label: 'Bálsamo labial' },
  { id: 'ducha', image: '/img/ducha.webp', short: 'Ducha', label: 'Ducha cuerpo y cabello' },
];

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id);
