import { Link, NavLink, useNavigate } from 'react-router-dom';
import CartWidget from './CartWidget';
import { CATEGORIES } from '../data/categories';
import { useAuth } from '../context/AuthContext';

const pillClass = ({ isActive }) => `pill${isActive ? ' is-active' : ''}`;

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch {
      // Cerrar sesión no depende de la red: si falla, el usuario puede intentarlo de nuevo.
    }
  };

  return (
    <header className="navbar">
      <div className="container navbar__top">
        <Link to="/" className="navbar__brand" aria-label="Lila del Alba, ir al inicio">
          <img src="/img/logo.png" alt="Lila del Alba" />
        </Link>

        <div className="navbar__actions">
          {!loading &&
            (user ? (
              <>
                <span className="navbar__user" title={user.email}>
                  {user.email}
                </span>
                <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn--ghost btn--sm" to="/login">
                  Ingresar
                </Link>
                <Link className="btn btn--dark btn--sm navbar__register" to="/register">
                  Registrarme
                </Link>
              </>
            ))}
          <CartWidget />
        </div>
      </div>

      <nav className="catnav" aria-label="Categorías">
        <div className="container catnav__list">
          <NavLink to="/" end className={pillClass}>
            Todos
          </NavLink>
          {CATEGORIES.map((category) => (
            <NavLink key={category.id} to={`/category/${category.id}`} className={pillClass}>
              {category.short}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
