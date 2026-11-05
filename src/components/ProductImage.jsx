// Foto del producto. Si no tiene (porque se quitó desde el panel), muestra un recuadro con el logo.
export default function ProductImage({ src, alt = '', ...props }) {
  if (!src) {
    return (
      <div className="noimage" role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        <img src="/img/logo.png" alt="" />
      </div>
    );
  }
  return <img src={src} alt={alt} {...props} />;
}
