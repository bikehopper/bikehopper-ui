import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { alertsReducer } from './features/alerts';
import type { ActionAlertMixin, AlertAction } from './features/alerts';
import { geocodingReducer } from './features/geocoding';
import { geolocationReducer } from './features/geolocation';
import { routeParamsReducer } from './features/routeParams';
import { routesReducer } from './features/routes';
import { storageMiddleware, initFromStorage } from './features/storage';
import { viewportReducer } from './features/viewport';
import type { ViewportAction } from './features/viewport';
import urlMiddleware from './lib/urlMiddleware';

const rootReducer = combineReducers({
  alerts: alertsReducer,
  geocoding: geocodingReducer,
  geolocation: geolocationReducer,
  routeParams: routeParamsReducer,
  routes: routesReducer,
  viewport: viewportReducer,
});

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

const enhancedCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  enhancedCompose(
    applyMiddleware(thunkMiddleware, urlMiddleware, storageMiddleware),
  ),
);

store.dispatch(initFromStorage());

export type BikeHopperAction = (ViewportAction | AlertAction) &
  ActionAlertMixin;

export default store;
