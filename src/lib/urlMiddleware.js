import { createBrowserHistory } from 'history';
import describePlace from '../lib/describePlace';
import { isPWA } from '../lib/pwa';
import {
  LocationSourceType,
  hydrateParamsFromUrl,
} from '../features/routeParams';

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
    const stateAfter = store.getState();
    const routeStateAfter = stateAfter.routes;

    if (!history) {
      // wait until map is loaded before initializing
      if (action.type === 'map_loaded') _initializeFromUrl(store);
      return;
    }

    if (
      action.type === 'route_fetch_failed' &&
      history.location.pathname !== '/'
    ) {
      history.replace('/' + history.location.search);
      return;
    } else if (routeStateBefore.routes === routeStateAfter.routes) {
      return;
    } else if (routeStateAfter.routes) {
      const params = stateAfter.routeParams;
      const queryString = history.location.search; // preserve any query params

      let from = routeStateAfter.routeStartCoords.join(',');
      let to = routeStateAfter.routeEndCoords.join(',');
      // Add the string description of the start and end point if applicable.
      // If there is a description, we use '@' as the separator character
      // between the description and the coordinates.
      if (
        _coordsEqual(
          routeStateAfter.routeStartCoords,
          params.start?.point?.geometry.coordinates,
        )
      ) {
        let fromText = describePlace(params.start.point, { fallback: '' });
        if (
          !fromText &&
          params.start.source === LocationSourceType.UrlWithString
        )
          fromText = params.start.fromInputText;
        if (fromText)
          from = encodeURIComponent(fromText.replace(/@/g, '_')) + '@' + from;
      }
      if (
        _coordsEqual(
          routeStateAfter.routeEndCoords,
          params.end.point?.geometry.coordinates,
        )
      ) {
        let toText = describePlace(params.end.point, { fallback: '' });
        if (!toText && params.end.source === LocationSourceType.UrlWithString)
          toText = params.end.fromInputText;
        if (toText)
          to = encodeURIComponent(toText.replace(/@/g, '_')) + '@' + to;
      }

      let generatedPath = `/route/${from}/to/${to}`;

      // add the departure/arrival time, if not departing now
      if (params.initialTime != null) {
        generatedPath +=
          '/' +
          (params.arriveBy ? 'a' : 'd') +
          '/' +
          new Date(params.initialTime).getTime();
      }
      history.replace(generatedPath + queryString);
    } else {
      history.replace('/' + history.location.search);
    }
  };
}

// When running as an app, only restore paths on restart if they're
// relatively recent.
const _PWA_DONT_RESTORE_PATHS_AFTER = 1000 * 60 * 60;

function _initializeFromUrl(store) {
  history = createBrowserHistory();

  let pathnameToInitializeFrom = history.location.pathname;

  if (isPWA()) {
    let lastPathname;
    let lastPathnameTime;
    try {
      lastPathname = localStorage.getItem('lastPathname');
      lastPathnameTime = localStorage.getItem('lastPathnameTime');
    } catch (e) {}

    if (
      lastPathname &&
      lastPathname !== '/' &&
      (!lastPathnameTime ||
        Date.now() - lastPathnameTime < _PWA_DONT_RESTORE_PATHS_AFTER)
    ) {
      pathnameToInitializeFrom = lastPathname;
    }

    history.listen(_copyUrlToLocalStorage);
  }

  const pathElements = pathnameToInitializeFrom.split('/').slice(1);
  const POINT_RE = /^(?:([^@]+)@+)?(-?\d+\.\d*),(-?\d+\.\d*)$/;

  // See if path can be parsed as a route, such as
  //   /route/-122,37/to/-123,37                  (depart now)
  //   /route/-122,37/to/-123,37/a/1662000000000  (arrive by)
  //   /route/-122,37/to/-123,37/d/1662000000000  (depart at)
  if (pathElements[0] === 'route' && pathElements[2] === 'to') {
    let [, startText, ...startCoords] = pathElements[1]?.match(POINT_RE) || [];
    let [, endText, ...endCoords] = pathElements[3]?.match(POINT_RE) || [];
    const arriveBy = pathElements[4] === 'a';
    let initialTime = null;

    const possibleDatetime = Number(pathElements[5]);
    if (!Number.isNaN(possibleDatetime)) initialTime = possibleDatetime;
    if (startCoords && endCoords) {
      startCoords = startCoords.map(Number);
      endCoords = endCoords.map(Number);
      if (startText) startText = decodeURIComponent(startText);
      if (endText) endText = decodeURIComponent(endText);
      store.dispatch(
        hydrateParamsFromUrl(
          startCoords,
          endCoords,
          startText,
          endText,
          arriveBy,
          initialTime,
        ),
      );
    }
  }
}

// Note: This function is used above in a case where the coordinates
// have not been converted to strings and back to numbers, so it's
// okay for this to be exact, not approximate, equality.
function _coordsEqual(a, b) {
  if (!a || !b) return a === b; // handle null input
  return a[0] === b[0] && a[1] === b[1];
}

// When running as a progressive web app, copy the location to localStorage
// so we can restore it if the app pages out of memory.
function _copyUrlToLocalStorage({ action, location }) {
  try {
    localStorage.setItem('lastPathname', location.pathname);
    localStorage.setItem('lastPathnameTime', Date.now());
  } catch (e) {}
}
