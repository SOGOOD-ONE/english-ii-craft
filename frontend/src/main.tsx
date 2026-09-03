import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// index.css 会被 vite 默认模板 import,不要留 tailwind;真正的 tailwind 在 globals.css(在 App.tsx 引入)
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
