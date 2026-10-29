import { useState } from 'react';

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 3) errors.name = 'Ingresá tu nombre y apellido.';
  if (values.phone.replace(/\D/g, '').length < 8) errors.phone = 'Ingresá un teléfono válido, con al menos 8 números.';
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Ingresá un email válido.';
  if (values.address.trim().length < 4) errors.address = 'Ingresá la dirección de entrega.';
  if (values.city.trim().length < 2) errors.city = 'Ingresá tu ciudad.';
  return errors;
}

export default function CheckoutForm({ defaultEmail, submitting, error, onSubmit }) {
  const [values, setValues] = useState({ name: '', phone: '', email: defaultEmail, address: '', city: '', notes: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit({
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      notes: values.notes.trim(),
    });
  };

  const field = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={`checkout-${name}`}>{label}</label>
      <input
        id={`checkout-${name}`}
        name={name}
        className={`input${errors[name] ? ' input--invalid' : ''}`}
        value={values[name]}
        onChange={handleChange}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `checkout-${name}-error` : undefined}
        {...props}
      />
      {errors[name] && (
        <span id={`checkout-${name}-error`} className="field__error">
          {errors[name]}
        </span>
      )}
    </div>
  );

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <h2 className="form__title">Datos de entrega</h2>
      {field('name', 'Nombre y apellido', { autoComplete: 'name' })}
      {field('phone', 'Teléfono', { type: 'tel', autoComplete: 'tel' })}
      {field('email', 'Email de contacto', { type: 'email', autoComplete: 'email' })}
      {field('address', 'Dirección', { autoComplete: 'street-address' })}
      {field('city', 'Ciudad', { autoComplete: 'address-level2' })}

      <div className="field">
        <label htmlFor="checkout-notes">Notas del pedido (opcional)</label>
        <textarea id="checkout-notes" name="notes" className="input" rows="3" value={values.notes} onChange={handleChange} />
      </div>

      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn--dark btn--block" disabled={submitting}>
        {submitting ? 'Procesando tu compra…' : 'Confirmar compra'}
      </button>
    </form>
  );
}
