import { combineReducers, createStore } from 'redux';
import { locationsReducer } from './features/locations';
import { routesReducer } from './features/routes';
import { viewportReducer } from './features/viewport';

const rootReducer = combineReducers({
  locations: locationsReducer,
  routes: routesReducer,
  viewport: viewportReducer,
});

const store = createStore(rootReducer);

export default store;
