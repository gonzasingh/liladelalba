import { createContext, useContext, useMemo } from 'react';
import { COLOR_CHOICES, FRAGRANCES } from '../data/fragrances';
import { useCollection } from '../hooks/useCollection';
import { describeError, saveCustomFragrances, UserError } from '../services/admin';
import { normalizeText } from '../utils/format';

const FragranceContext = createContext(null);

// Lista de fragancias del panel: las de la marca más las que se agregan desde el desplegable.
export function FragranceProvider({ children }) {
  const settings = useCollection('settings');
  const custom = useMemo(() => settings.data.find((item) => item.id === 'fragrances')?.custom ?? [], [settings.data]);

  const value = useMemo(() => {
    const fragrances = [...FRAGRANCES, ...custom];

    // Devuelve el nombre ya limpio. Falla con un mensaje claro si es inválido o está repetido.
    const addFragrance = async (name) => {
      const clean = name.trim().replace(/\s+/g, ' ');
      if (clean.length < 2) throw new UserError('Escribí el nombre de la fragancia (mínimo 2 letras).');
      const taken = [...fragrances, ...COLOR_CHOICES].some((item) => normalizeText(item) === normalizeText(clean));
      if (taken) throw new UserError('Esa fragancia ya está en la lista.');
      try {
        await saveCustomFragrances([...custom, clean]);
      } catch (error) {
        throw new UserError(describeError(error));
      }
      return clean;
    };

    return { fragrances, allChoices: [...fragrances, ...COLOR_CHOICES], addFragrance };
  }, [custom]);

  return <FragranceContext.Provider value={value}>{children}</FragranceContext.Provider>;
}

export function useFragrances() {
  const context = useContext(FragranceContext);
  if (!context) throw new Error('useFragrances debe usarse dentro de <FragranceProvider>');
  return context;
}
