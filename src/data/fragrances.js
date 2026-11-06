import { normalizeText } from '../utils/format';

// Las 16 fragancias de la marca (listas de fragancias del hogar y de cuidado personal, sin repetir Guayaba).
export const FRAGRANCES = [
  'Bamboo',
  'Lemongrass',
  'Mango & Maracuyá',
  'Guayaba',
  'Frambuesa & Pimienta',
  'Tilo & Lavanda',
  'Verbena & Flores Blancas',
  'Melón & Sandía',
  'Uva & Caramelo',
  'Açaí',
  'Nikki',
  'Moras & Fresias',
  'Gardenias',
  'Coco & Vainilla',
  'Cerezo en flor',
  'Mora roja & Jabuticaba',
];

// Para los productos que se ofrecen con o sin color (por ejemplo, el bálsamo labial).
export const COLOR_CHOICES = ['Con Color', 'Sin Color'];

export const ALL_CHOICES = [...FRAGRANCES, ...COLOR_CHOICES];

const FRAGRANCE_LABEL = 'Fragancia';
const COLOR_LABEL = 'Color';

const isFragranceOption = (option) => normalizeText(option.label) === 'fragancia';
// "Versión" es como se llamaba antes la opción con o sin color.
const isColorOption = (option) => ['color', 'version'].includes(normalizeText(option.label));

const matchChoice = (list, value) => list.find((item) => normalizeText(item) === normalizeText(value));

// Fragancias y colores que ofrece un producto, en el orden de la lista.
// "fragrances" es la lista completa: las 16 de la marca más las que se agregaron desde el panel.
export function getSelectedChoices(product, fragrances = FRAGRANCES) {
  const options = product.options ?? [];
  const found = new Set();
  options.filter(isFragranceOption).forEach((option) =>
    option.values.forEach((value) => {
      const match = matchChoice(fragrances, value);
      if (match) found.add(match);
    })
  );
  options.filter(isColorOption).forEach((option) =>
    option.values.forEach((value) => {
      const match = matchChoice(COLOR_CHOICES, value);
      if (match) found.add(match);
    })
  );
  return [...fragrances, ...COLOR_CHOICES].filter((choice) => found.has(choice));
}

// Opciones del producto que el desplegable no maneja (por ejemplo, la arcilla de los jabones).
export const getOtherOptions = (product) =>
  (product.options ?? []).filter((option) => !isFragranceOption(option) && !isColorOption(option));

// Arma las opciones que ve la clienta en la tienda a partir de lo elegido en el desplegable.
export function buildOptions(choices, otherOptions = [], fragrances = FRAGRANCES) {
  const chosenFragrances = fragrances.filter((name) => choices.includes(name));
  const colors = COLOR_CHOICES.filter((name) => choices.includes(name));
  return [
    ...(chosenFragrances.length ? [{ label: FRAGRANCE_LABEL, values: chosenFragrances }] : []),
    ...(colors.length ? [{ label: COLOR_LABEL, values: colors }] : []),
    ...otherOptions,
  ];
}
