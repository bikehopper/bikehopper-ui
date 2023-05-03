import Bowser from 'bowser';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { shouldPolyfill as listFormatShouldPolyfill } from '@formatjs/intl-listformat/should-polyfill';
import reportWebVitals from './reportWebVitals';
import App from './components/App';
import store from './store';

import './index.css';

async function loadMessages(locale) {
  if (listFormatShouldPolyfill(locale)) {
    await import('@formatjs/intl-listformat/polyfill-force');
    // hack: vite doesn't support this kind of dynamic import,
    // so just import likely locales for now
    if (locale.startsWith('en')) {
      await import('@formatjs/intl-listformat/locale-data/en-CA');
      await import('@formatjs/intl-listformat/locale-data/en-GB');
      await import('@formatjs/intl-listformat/locale-data/en-IN');
      await import('@formatjs/intl-listformat/locale-data/en');
    } else if (locale.startsWith('es')) {
      await import('@formatjs/intl-listformat/locale-data/es-US');
      await import('@formatjs/intl-listformat/locale-data/es-MX');
      await import('@formatjs/intl-listformat/locale-data/es-HN');
      await import('@formatjs/intl-listformat/locale-data/es-GT');
      await import('@formatjs/intl-listformat/locale-data/es-PH');
      await import('@formatjs/intl-listformat/locale-data/es-CU');
      await import('@formatjs/intl-listformat/locale-data/es');
    }
  }

  if (/^es\b/.test(locale)) {
    // all variants of Spanish
    return (await import('../compiled-lang/es.json')).default;
  } else {
    // default to English
    return (await import('../compiled-lang/en.json')).default;
  }
}

function selectLocale() {
  // override via query params
  const overrideLocale = new URLSearchParams(document.location.search).get(
    'locale',
  );
  if (overrideLocale) {
    try {
      const canonical = Intl.getCanonicalLocales(overrideLocale)[0];
      if (canonical) return canonical;
    } catch (e) {
      console.warn('ignoring unknown locale ' + overrideLocale);
    }
  }

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
  reportWebVitals(console.log);
}

bootstrapApp();
