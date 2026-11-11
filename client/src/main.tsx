import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import './styles.css';

// auth0-react v2 expects the bare domain (no https://).
const domain = (import.meta.env.VITE_AUTH0_DOMAIN ?? '').replace(/^https?:\/\//, '');
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID ?? '';
const audience = import.meta.env.VITE_AUTH0_AUDIENCE ?? '';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{ audience, redirect_uri: window.location.origin }}
      cacheLocation="memory"
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>,
);
