import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { locationsReducer } from './features/locations';
import { routesReducer } from './features/routes';
import { viewportReducer } from './features/viewport';

const rootReducer = combineReducers({
  locations: locationsReducer,
  routes: routesReducer,
  viewport: viewportReducer,
});

const enhancedCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  enhancedCompose(applyMiddleware(thunkMiddleware)),
);

export default store;