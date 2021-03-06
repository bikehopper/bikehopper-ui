import Bowser from 'bowser';
import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import App from './components/App';
import store from './store';

import './index.css';

const ua = Bowser.parse(navigator.userAgent);
if (
  ua.os.name === 'iOS' &&
  (ua.browser.name === 'Chrome' || ua.browser.name === 'Safari')
) {
  document.body.className += ' isIOSChromeOrSafari';
}

render(
  <React.StrictMode>
    <Router>
      <Provider store={store}>
        <App />
      </Provider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
