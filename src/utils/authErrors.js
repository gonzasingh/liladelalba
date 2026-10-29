const MESSAGES = {
  'auth/email-already-in-use': 'Ese email ya está registrado. Probá iniciar sesión.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/missing-password': 'Ingresá tu contraseña.',
  'auth/invalid-credential': 'El email o la contraseña no son correctos.',
  'auth/user-not-found': 'El email o la contraseña no son correctos.',
  'auth/wrong-password': 'El email o la contraseña no son correctos.',
  'auth/too-many-requests': 'Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.',
  'auth/network-request-failed': 'No hay conexión. Revisá tu internet y probá de nuevo.',
  'auth/operation-not-allowed': 'El acceso con email y contraseña no está habilitado en Firebase.',
  'auth/unauthorized-domain': 'Este sitio no está autorizado en Firebase Authentication.',
};

export const getAuthErrorMessage = (error) =>
  MESSAGES[error?.code] ?? 'No pudimos completar la operación. Probá de nuevo.';
