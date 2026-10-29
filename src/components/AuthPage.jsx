import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthForm from './AuthForm';
import Loader from './Loader';
import { useAuth } from '../context/AuthContext';

// Páginas /login y /register. Si ya hay sesión, redirige a donde venía el usuario.
export default function AuthPage({ mode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return <Loader text="Verificando tu sesión…" />;
  if (user) return <Navigate to={location.state?.from ?? '/'} replace />;

  return (
    <section className="authpage">
      <AuthForm
        key={mode}
        mode={mode}
        onSwitch={(next) => navigate(next === 'login' ? '/login' : '/register', { replace: true, state: location.state })}
      />
    </section>
  );
}
