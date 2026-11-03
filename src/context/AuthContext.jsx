import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // "loading" es true hasta que Firebase informa si hay una sesión guardada y si es administradora.
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!currentUser) {
            setUser(null);
            setIsAdmin(false);
            setLoading(false);
            return;
          }

          setLoading(true);
          let admin = false;
          try {
            // Las administradoras figuran en la colección "admins", con su UID como ID del documento.
            admin = (await getDoc(doc(db, 'admins', currentUser.uid))).exists();
          } catch {
            admin = false;
          }
          setUser(currentUser);
          setIsAdmin(admin);
          setLoading(false);
        },
        () => setLoading(false)
      ),
    []
  );

  const register = useCallback((email, password) => createUserWithEmailAndPassword(auth, email, password), []);
  const login = useCallback((email, password) => signInWithEmailAndPassword(auth, email, password), []);
  const logout = useCallback(() => signOut(auth), []);

  const value = useMemo(
    () => ({ user, isAdmin, loading, register, login, logout }),
    [user, isAdmin, loading, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
