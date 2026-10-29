export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__text">
        <h1 id="hero-title" className="hero__title">
          Una colección para cualquier espacio y momento
        </h1>
        <p className="hero__lead">
          Velas, difusores, spray textil y cuidado personal. Todas las fragancias son aptas para velas,
          difusores y spray textil.
        </p>
        <a className="btn btn--dark" href="#catalogo">
          Ver productos
        </a>
      </div>
      <img className="hero__photo" src="/img/hero.webp" alt="Mujer sonriendo con una toalla en el pelo y una crema en la mano" />
    </section>
  );
}
