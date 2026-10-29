import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Al cambiar de ruta vuelve al inicio de la página (salvo que la URL apunte a un #ancla).
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
