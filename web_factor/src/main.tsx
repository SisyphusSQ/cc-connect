import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'highlight.js/styles/github.css';
import '@factor/i18n';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import App from '@factor/App';
import '@factor/styles.css';

useAuthStore.getState().init();
useThemeStore.getState().init();

api.setOnUnauthorized(() => {
  useAuthStore.getState().logout();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
