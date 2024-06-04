import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import type { AnyAction } from 'redux';
import thunkMiddleware from 'redux-thunk';
import type { ThunkAction } from 'redux-thunk';
import { alertsReducer } from './features/alerts';
import type { ActionAlertMixin, AlertAction } from './features/alerts';
import { geocodingReducer } from './features/geocoding';
import type { GeocodingAction } from './features/geocoding';
import { geolocationReducer } from './features/geolocation';
import type { GeolocationAction } from './features/geolocation';
import type { MiscAction } from './features/misc';
import { routeParamsReducer } from './features/routeParams';
import type { RouteParamsAction } from './features/routeParams';
import { routesReducer } from './features/routes';
import type { RoutesAction } from './features/routes';
import { storageMiddleware, initFromStorage } from './features/storage';
import type { StorageAction } from './features/storage';
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
export type RootState = ReturnType<typeof rootReducer>;
export type BikeHopperThunkAction = ThunkAction<
  void,
  RootState,
  void,
  AnyAction
>;

store.dispatch(initFromStorage());

export type BikeHopperAction = (
  | AlertAction
  | GeocodingAction
  | GeolocationAction
  | MiscAction
  | RouteParamsAction
  | RoutesAction
  | StorageAction
  | ViewportAction
) &
  ActionAlertMixin;

export default store;
