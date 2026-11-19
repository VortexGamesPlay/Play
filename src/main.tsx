import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/layout.css';
import './ui/styles/components.css';
import './ui/styles/art.css';
import './ui/styles/screens.css';
import './ui/styles/hatch.css';
import './ui/styles/battle.css';
import { App } from './ui/App';
import { validateContent } from './data/validate';

if (import.meta.env.DEV) {
  const errors = validateContent();
  if (errors.length) console.error('[EGGVERSE] Contenu invalide :', errors);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
