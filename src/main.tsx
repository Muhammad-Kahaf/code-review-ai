import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import './index.css'

// IMPORTANT: Replace this placeholder with your actual Google Client ID from the Google Cloud Console.
const GOOGLE_CLIENT_ID = "361410327260-mqedf4luqthr9o8eas1b5u6noarmveao.apps.googleusercontent.com";

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
)
