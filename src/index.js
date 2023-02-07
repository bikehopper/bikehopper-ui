import Bowser from 'bowser';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import App from './components/App';
import store from './store';

import './index.css';

function loadMessages(locale) {
  if (/^es\b/.test(locale)) {
    // all variants of Spanish
    return import('../compiled-lang/es.json');
  } else {
    // default to English
    return import('../compiled-lang/en.json');
  }
}

function selectLocale() {
  // override via query params
  const overrideLocale = new URLSearchParams(document.location.search).get(
    'locale',
  );
  if (overrideLocale) return overrideLocale;

  // browser default
  return navigator.language;
}

async function bootstrapApp() {
  const ua = Bowser.parse(navigator.userAgent);
  if (
    ua.os.name === 'iOS' &&
    (ua.browser.name === 'Chrome' || ua.browser.name === 'Safari')
  ) {
    document.body.className += ' isIOSChromeOrSafari';
  }

  const root = createRoot(document.getElementById('root'));
  const locale = selectLocale();
  const messages = await loadMessages(locale);

  root.render(
    <React.StrictMode>
      <Router>
        <Provider store={store}>
          <App messages={messages} locale={locale} />
        </Provider>
      </Router>
    </React.StrictMode>,
  );

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals();
}

bootstrapApp();
