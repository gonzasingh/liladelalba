import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ConfigError from './components/ConfigError.jsx';
import { firebaseConfigured } from './firebase/config';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>{firebaseConfigured ? <App /> : <ConfigError />}</StrictMode>
);
