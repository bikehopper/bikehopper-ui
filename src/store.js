import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { geocodingReducer } from './features/geocoding';
import { geolocationReducer } from './features/geolocation';
import { routeParamsReducer } from './features/routeParams';
import { routesReducer } from './features/routes';
import { viewportReducer } from './features/viewport';

const rootReducer = combineReducers({
  geocoding: geocodingReducer,
  geolocation: geolocationReducer,
  routeParams: routeParamsReducer,
  routes: routesReducer,
  viewport: viewportReducer,
});

const enhancedCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  enhancedCompose(applyMiddleware(thunkMiddleware)),
);

export default store;
