export default function Loader({ text = 'Cargando…' }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader__spinner" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
