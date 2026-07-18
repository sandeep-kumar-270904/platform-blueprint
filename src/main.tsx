import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./i18n";
import "./index.css";

// Global fetch interceptor to automatically include credentials (cookies) for all requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (!config) {
    config = {};
  }
  config.credentials = 'include';
  return originalFetch(resource, config);
};

import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(<App />);
