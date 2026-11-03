import { useState } from 'react';
import OrderOptions from './OrderOptions';
import { useCart } from '../context/CartContext';

const REQUIRED = {
  name: 'Ingresá tu nombre y apellido.',
  phone: 'Ingresá un teléfono válido, con al menos 8 números.',
  email: 'Ingresá un email válido.',
  address: 'Ingresá la calle, número y piso o departamento.',
  city: 'Ingresá tu ciudad o localidad.',
  postalCode: 'Ingresá tu código postal (de 4 a 8 caracteres).',
};

function validate(values, paymentMethod, province) {
  const errors = {};
  if (values.name.trim().length < 3) errors.name = REQUIRED.name;
  if (values.phone.replace(/\D/g, '').length < 8) errors.phone = REQUIRED.phone;
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = REQUIRED.email;
  if (values.address.trim().length < 4) errors.address = REQUIRED.address;
  if (values.city.trim().length < 2) errors.city = REQUIRED.city;
  if (!/^[A-Za-z0-9]{4,8}$/.test(values.postalCode.trim())) errors.postalCode = REQUIRED.postalCode;
  if (!paymentMethod) errors.paymentMethod = 'Elegí un método de pago.';
  if (!province) errors.province = 'Elegí la provincia de entrega.';
  return errors;
}

export default function CheckoutForm({ defaultEmail, submitting, error, onSubmit }) {
  const { paymentMethod, province } = useCart();
  const [values, setValues] = useState({
    name: '',
    phone: '',
    email: defaultEmail,
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validate(values, paymentMethod, province);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit({
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      postalCode: values.postalCode.trim().toUpperCase(),
      province,
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
      <h2 className="form__title">Pago y envío</h2>
      <OrderOptions errors={errors} />

      <h2 className="form__title">Datos de entrega a domicilio</h2>
      {field('name', 'Nombre y apellido', { autoComplete: 'name' })}
      {field('phone', 'Teléfono', { type: 'tel', autoComplete: 'tel' })}
      {field('email', 'Email de contacto', { type: 'email', autoComplete: 'email' })}
      {field('address', 'Dirección (calle, número, piso y depto.)', { autoComplete: 'street-address' })}
      {field('city', 'Ciudad o localidad', { autoComplete: 'address-level2' })}
      {field('postalCode', 'Código postal', { autoComplete: 'postal-code' })}

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
