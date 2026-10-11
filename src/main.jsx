import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './lib/AuthContext.jsx';
import './referencePalette.css';
import './dashboardRefinement.css';
import './interaction.css';
import './motion.css';
import './elevenWhite.css';

const BotLab=import.meta.env.DEV?lazy(()=>import('./screens/DreamBotLab')):null;
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {BotLab&&window.location.pathname==='/dev/dreambot'?<Suspense fallback={<p>Đang tải DreamBot…</p>}><BotLab/></Suspense>:
    <AuthProvider>
      <App />
    </AuthProvider>}
  </StrictMode>
);
