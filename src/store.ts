import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import type { Action } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { alertsReducer } from './features/alerts';
import type { ActionAlertMixin, AlertAction } from './features/alerts';
import { geocodingReducer } from './features/geocoding';
import type { GeocodingAction } from './features/geocoding';
import { geolocationReducer } from './features/geolocation';
import type { GeolocationAction } from './features/geolocation';
import type { MiscAction } from './features/misc';
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

export type Dispatch = typeof store.dispatch;
export type GetState = typeof store.getState;

store.dispatch(initFromStorage());

export type BikeHopperAction = (
  | AlertAction
  | GeocodingAction
  | GeolocationAction
  | MiscAction
  | ViewportAction
  // TODO fix fake types below
  | (Action<'hydrate_from_localstorage'> & {
      geocodingOsmCache: any;
      geocodingRecentlyUsed: any;
    })
  | (Action<'locations_set'> & Record<string, any>)
  | (Action<'geocoded_location_selected'> & Record<string, any>)
) &
  ActionAlertMixin;

export default store;
