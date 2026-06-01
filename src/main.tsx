import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import { Auth0Provider } from '@auth0/auth0-react';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

if (!domain || !clientId) {
  createRoot(document.getElementById('root')!).render(
    <div style={{ padding: '2rem', color: 'red', fontFamily: 'sans-serif' }}>
      <h2>Missing Auth0 Configuration</h2>
      <p>The application could not start because the Auth0 environment variables are missing.</p>
      <p>Please ensure you have saved your <strong>.env.local</strong> file in the root directory with the following variables:</p>
      <pre style={{ background: '#f4f4f4', padding: '1rem', color: '#333' }}>
        VITE_AUTH0_DOMAIN=your_domain{'\n'}
        VITE_AUTH0_CLIENT_ID=your_client_id{'\n'}
        VITE_AUTH0_AUDIENCE=your_audience
      </pre>
      <p>After saving the file, <strong>you must restart your Vite dev server</strong>.</p>
    </div>
  );
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: audience,
        }}
      >
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </Auth0Provider>
    </StrictMode>,
  )
}
