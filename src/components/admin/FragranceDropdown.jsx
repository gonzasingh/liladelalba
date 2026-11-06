import { useEffect, useRef, useState } from 'react';
import { useFragrances } from '../../context/FragranceContext';

const READONLY_TEXT = 'Ver fragancias o colores seleccionados';
const PLACEHOLDER = 'Elige las fragancias o si es con o sin color';

// Desplegable con la lista completa de fragancias y colores.
// readOnly: solo muestra cuáles tiene el producto (tabla de stock). Si no, permite elegirlas y sumar fragancias nuevas.
export default function FragranceDropdown({ selected, onChange, readOnly = false, ariaLabel }) {
  const { fragrances, allChoices, addFragrance } = useFragrances();
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newError, setNewError] = useState('');
  const [savingNew, setSavingNew] = useState(false);
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

  const closeNewFragrance = () => {
    setAdding(false);
    setNewName('');
    setNewError('');
  };

  // Suma la fragancia a la lista del panel y la deja tildada para el producto que se está cargando.
  const submitNewFragrance = async () => {
    setSavingNew(true);
    setNewError('');
    try {
      const added = await addFragrance(newName);
      onChange([...selected, added]);
      closeNewFragrance();
    } catch (error) {
      setNewError(error.message);
    } finally {
      setSavingNew(false);
    }
  };

  const handleNewKeyDown = (event) => {
    if (event.key === 'Enter') {
      // Enter agrega la fragancia; no debe enviar el formulario que contiene al desplegable.
      event.preventDefault();
      submitNewFragrance();
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      closeNewFragrance();
    }
  };

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
            <div className="fd__head">
              <div className="fd__tools">
                <button type="button" className="linkbtn" onClick={() => onChange([...new Set([...selected, ...fragrances])])}>
                  Marcar todas las fragancias
                </button>
                <button type="button" className="linkbtn" onClick={() => onChange([])}>
                  Quitar todo
                </button>
                <button
                  type="button"
                  className="linkbtn"
                  aria-expanded={adding}
                  onClick={() => (adding ? closeNewFragrance() : setAdding(true))}
                >
                  Agregar nueva fragancia
                </button>
              </div>
              {adding && (
                <div className="fd__new">
                  <input
                    className="input"
                    placeholder="Nombre de la nueva fragancia"
                    aria-label="Nombre de la nueva fragancia"
                    maxLength={40}
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    onKeyDown={handleNewKeyDown}
                    autoFocus
                  />
                  <button type="button" className="btn btn--dark btn--sm" onClick={submitNewFragrance} disabled={savingNew}>
                    {savingNew ? 'Agregando…' : 'Agregar'}
                  </button>
                  {newError && (
                    <span className="field__error fd__error" role="alert">
                      {newError}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          <ul className="fd__list">
            {allChoices.map((choice) => {
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
