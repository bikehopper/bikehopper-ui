import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { alertsReducer } from './features/alerts';
import { geocodingReducer } from './features/geocoding';
import { geolocationReducer } from './features/geolocation';
import { routeParamsReducer } from './features/routeParams';
import { routesReducer } from './features/routes';
import { storageMiddleware, initFromStorage } from './features/storage';
import { viewportReducer } from './features/viewport';
import urlMiddleware from './lib/urlMiddleware';

const rootReducer = combineReducers({
  alerts: alertsReducer,
  geocoding: geocodingReducer,
  geolocation: geolocationReducer,
  routeParams: routeParamsReducer,
  routes: routesReducer,
  viewport: viewportReducer,
});

const enhancedCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  enhancedCompose(
    applyMiddleware(thunkMiddleware, urlMiddleware, storageMiddleware),
  ),
);

store.dispatch(initFromStorage());

export default store;
