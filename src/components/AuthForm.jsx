import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/authErrors';

// mode: "login" | "register". onSwitch(mode) cambia entre ambos formularios.
export default function AuthForm({ mode, onSwitch }) {
  const { login, register } = useAuth();
  const isLogin = mode === 'login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!isLogin && password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) await login(email.trim(), password);
      else await register(email.trim(), password);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form authform" onSubmit={handleSubmit}>
      <h2 className="form__title">{isLogin ? 'Ingresá a tu cuenta' : 'Creá tu cuenta'}</h2>

      <div className="field">
        <label htmlFor={`${mode}-email`}>Email</label>
        <input
          id={`${mode}-email`}
          className="input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor={`${mode}-password`}>Contraseña</label>
        <input
          id={`${mode}-password`}
          className="input"
          type="password"
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          minLength={isLogin ? undefined : 6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {!isLogin && <span className="field__hint">Mínimo 6 caracteres.</span>}
      </div>

      {!isLogin && (
        <div className="field">
          <label htmlFor="register-confirm">Repetí la contraseña</label>
          <input
            id="register-confirm"
            className="input"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
      )}

      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn--dark btn--block" disabled={submitting}>
        {submitting ? (isLogin ? 'Ingresando…' : 'Creando tu cuenta…') : isLogin ? 'Ingresar' : 'Crear cuenta'}
      </button>

      <p className="form__switch">
        {isLogin ? '¿Todavía no tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
        <button type="button" className="linkbtn" onClick={() => onSwitch(isLogin ? 'register' : 'login')}>
          {isLogin ? 'Registrate' : 'Ingresá'}
        </button>
      </p>
    </form>
  );
}
