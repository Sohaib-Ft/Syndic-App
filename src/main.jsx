import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { LangProvider } from './contexts/LangContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <LangProvider>
          <AuthProvider>
            <App />
            <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', background: '#1e293b', color: '#fff' } }} />
          </AuthProvider>
        </LangProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>
)
