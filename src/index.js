import * as React from 'react';
import { render } from 'react-dom';
import reportWebVitals from './reportWebVitals';
import BikehopperMap from './components/BikehopperMap';

import './index.css';

// restricted public token that is safe to share
const MAPBOX_TOKEN = 'pk.eyJ1IjoiMmpoazNicjJqZXF1IiwiYSI6ImNrejUzM2hxeDBobWYycG8wdzlpb3ppcjUifQ.dgo6QQyOJykr-m-2epbgGw';

function Root() {
  return (
    <BikehopperMap mapboxApiAccessToken={MAPBOX_TOKEN} />
  );
}

render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
