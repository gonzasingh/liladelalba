export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <img className="footer__logo" src="/img/logo.png" alt="Lila del Alba" />
        <p className="footer__text">Una colección para cualquier espacio y momento.</p>
        <a
          className="footer__link"
          href="https://www.instagram.com/liladelalba/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram @liladelalba
        </a>
      </div>
      <p className="footer__copy">© {new Date().getFullYear()} Lila del Alba</p>
    </footer>
  );
}
