import Bowser from 'bowser';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { shouldPolyfill as listFormatShouldPolyfill } from '@formatjs/intl-listformat/should-polyfill';

import App from './components/App';
import { init as initStore } from './store';
import { fetchRegionConfig } from './lib/BikeHopperClient';
import { init as initRegion } from './lib/region';

import './index.css';

async function loadMessages(locale: string) {
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

function selectLocale(): string {
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

async function bootstrapApp(): Promise<void> {
  const ua = Bowser.parse(navigator.userAgent);
  if (
    ua.os.name === 'iOS' &&
    (ua.browser.name === 'Chrome' || ua.browser.name === 'Safari')
  ) {
    document.body.className += ' isIOSChromeOrSafari';
  }

  const root = createRoot(document.getElementById('root')!);
  const locale = selectLocale();
  const [regionConfig, messages] = await Promise.all([
    fetchRegionConfig(),
    loadMessages(locale),
  ]);
  initRegion(regionConfig);
  const store = initStore();

  root.render(
    <StrictMode>
      <Provider store={store}>
        <App messages={messages} locale={locale} />
      </Provider>
    </StrictMode>,
  );
}

bootstrapApp();
