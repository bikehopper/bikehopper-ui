import { createBrowserHistory } from 'history';
import { hydrateLocationsFromUrl } from '../features/routeParams';

/*
 * Middleware for maintaining the URL in the browser location bar.
 * This is usually called client-side routing but unfortunately for
 * this app routing also means giving directions, making such
 * terminology confusing.
 */

let history;

export default function routesUrlMiddleware(store) {
  return (next) => (action) => {
    const routeStateBefore = store.getState().routes;
    next(action);
    const routeStateAfter = store.getState().routes;

    if (!history) {
      _initializeFromUrl(store);
      return;
    }

    if (
      action.type === 'route_fetch_failed' &&
      history.location.pathname !== '/'
    ) {
      history.replace('/');
      return;
    } else if (routeStateBefore.routes === routeStateAfter.routes) {
      return;
    } else if (routeStateAfter.routes) {
      const from = routeStateAfter.routeStartCoords.join(',');
      const to = routeStateAfter.routeEndCoords.join(',');
      history.replace(`/route/${from}/to/${to}`);
    } else {
      history.replace('/');
    }
  };
}

function _initializeFromUrl(store) {
  history = createBrowserHistory();

  const path = history.location.pathname;
  // See if it can be parsed as a route
  const matches = path.match(
    /^\/route\/(-?\d+\.\d*),(-?\d+\.\d*)\/to\/(-?\d+\.\d*),(-?\d+\.\d*)$/,
  );
  if (matches) {
    const startCoords = matches.slice(1, 3).map(Number);
    const endCoords = matches.slice(3, 5).map(Number);
    store.dispatch(hydrateLocationsFromUrl(startCoords, endCoords));
  }
}
