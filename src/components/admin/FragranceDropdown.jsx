import { useEffect, useRef, useState } from 'react';
import { ALL_CHOICES, FRAGRANCES } from '../../data/fragrances';

const READONLY_TEXT = 'Ver fragancias o colores seleccionados';
const PLACEHOLDER = 'Elige las fragancias o si es con o sin color';

// Desplegable con la lista completa de fragancias y colores.
// readOnly: solo muestra cuáles tiene el producto (tabla de stock). Si no, permite elegirlas (alta y edición).
export default function FragranceDropdown({ selected, onChange, readOnly = false, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    // El panel va "fixed" para que no lo recorte la tabla; se abre hacia arriba si abajo no hay lugar.
    const rect = buttonRef.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const openUp = below < 300 && above > below;
    setStyle({
      left: rect.left,
      width: Math.max(rect.width, 270),
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4, maxHeight: Math.min(440, above) }
        : { top: rect.bottom + 4, maxHeight: Math.min(440, below) }),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;

    const closeIfOutside = (event) => {
      if (panelRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);

    document.addEventListener('mousedown', closeIfOutside);
    window.addEventListener('scroll', closeIfOutside, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', closeIfOutside);
      window.removeEventListener('scroll', closeIfOutside, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  // Escape cierra solo el desplegable, no la ventana de edición que pueda tenerlo adentro.
  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  const toggleChoice = (choice) =>
    onChange(selected.includes(choice) ? selected.filter((item) => item !== choice) : [...selected, choice]);

  const text = readOnly ? READONLY_TEXT : selected.length > 0 ? selected.join(', ') : PLACEHOLDER;

  return (
    <div className="fd">
      <button
        ref={buttonRef}
        type="button"
        className="input fd__button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={toggle}
        onKeyDown={handleKeyDown}
      >
        <span className="fd__text">{text}</span>
        <span className="fd__caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div ref={panelRef} className="fd__panel" style={style} onKeyDown={handleKeyDown}>
          {!readOnly && (
            <div className="fd__tools">
              <button type="button" className="linkbtn" onClick={() => onChange([...new Set([...selected, ...FRAGRANCES])])}>
                Marcar todas las fragancias
              </button>
              <button type="button" className="linkbtn" onClick={() => onChange([])}>
                Quitar todo
              </button>
            </div>
          )}
          <ul className="fd__list">
            {ALL_CHOICES.map((choice) => {
              const checked = selected.includes(choice);
              return (
                <li key={choice} className={`fd__item${checked ? ' is-checked' : ''}`}>
                  {readOnly ? (
                    <span className="fd__row">
                      <span className="fd__box" aria-hidden="true" />
                      {choice}
                      <span className="sr-only">{checked ? ' (incluida)' : ' (no incluida)'}</span>
                    </span>
                  ) : (
                    <label className="fd__row">
                      <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleChoice(choice)} />
                      <span className="fd__box" aria-hidden="true" />
                      {choice}
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
