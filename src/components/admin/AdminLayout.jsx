import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import Loader from '../Loader';
import Message from '../Message';
import { useAuth } from '../../context/AuthContext';
import { FragranceProvider } from '../../context/FragranceContext';

const tabClass = ({ isActive }) => `admintab${isActive ? ' is-active' : ''}`;

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader text="Verificando tu sesión…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (!isAdmin) {
    return (
      <Message
        type="error"
        title="Acceso restringido"
        action={
          <Link className="btn btn--dark" to="/">
            Volver a la tienda
          </Link>
        }
      >
        Tu cuenta no tiene permisos para entrar al panel de control.
      </Message>
    );
  }

  return (
    <section className="admin">
      <nav className="admintabs" aria-label="Panel de control">
        <Link className="admintab" to="/">
          Tienda
        </Link>
        <NavLink to="/admin/ventas" className={tabClass}>
          Ventas
        </NavLink>
        <NavLink to="/admin/stock" className={tabClass}>
          Stock
        </NavLink>
        <NavLink to="/admin/caja" className={tabClass}>
          Caja
        </NavLink>
      </nav>
      <FragranceProvider>
        <Outlet />
      </FragranceProvider>
    </section>
  );
}
