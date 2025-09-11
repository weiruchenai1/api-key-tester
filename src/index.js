import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// CSS导入 - 严格按优先级顺序，确保所有环境一致
import './styles/variables.css';
import './styles/themes.css';
import './styles/globals.css';
import './styles/components.css';
import './styles/utilities.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
