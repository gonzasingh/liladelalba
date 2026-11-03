export default function ConfigError() {
  return (
    <main className="container" style={{ padding: '48px 0' }}>
      <div className="message message--error" role="alert">
        <h1 className="message__title">Falta configurar Firebase</h1>
        <p className="message__text">
          No se encontraron las variables de entorno VITE_FIREBASE_*. En tu computadora completá el archivo
          .env (podés copiar .env.example). En Vercel cargalas en Settings &gt; Environment Variables y
          volvé a desplegar.
        </p>
      </div>
    </main>
  );
}
