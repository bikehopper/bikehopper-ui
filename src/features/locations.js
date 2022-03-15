import produce from 'immer';
import { geocodeTypedLocation } from './geocoding';
import { fetchRoute } from './routes';

const DEFAULT_STATE = {
  isEditingLocations: false,
  startPoint: null,
  endPoint: null,
};

export function locationsReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'locations_set':
      return produce(state, (draft) => {
        draft.startPoint = action.startPoint;
        draft.endPoint = action.endPoint;
        if (action.startPoint && action.endPoint)
          draft.isEditingLocations = false;
      });
    case 'location_input_focused':
      return { ...state, isEditingLocations: true };
    default:
      return state;
  }
}

// Actions

export function locationsSubmitted(startText, endText) {
  // Note: may want to modify this later to accept start and/or end already
  // being resolved to a confirmed location, possibly the current location, and
  // so not just text.
  return async function locationsSubmittedThunk(dispatch, getState) {
    const geocodeOrUseCached = async function geocodeOrUseCached(
      text,
      startOrEnd,
    ) {
      let cacheEntry = getState().geocoding.cache['@' + text];
      if (cacheEntry && cacheEntry.status === 'succeeded')
        return cacheEntry.features[0];

      await geocodeTypedLocation(text, startOrEnd, {
        possiblyIncomplete: false,
      })(dispatch, getState);

      // check again if geocoding succeeded (there's no direct return value)
      cacheEntry = getState().geocoding.cache['@' + text];
      if (cacheEntry && cacheEntry.status === 'succeeded')
        return cacheEntry.features[0];

      return null;
    };

    startText = startText.trim();
    endText = endText.trim();

    const [startPoint, endPoint] = (
      await Promise.allSettled([
        geocodeOrUseCached(startText, 'start'),
        geocodeOrUseCached(endText, 'end'),
      ])
    ).map((promiseResult) =>
      promiseResult.status === 'fulfilled' ? promiseResult.value : null,
    );

    await _setLocationsAndMaybeFetchRoute(
      dispatch,
      getState,
      startPoint,
      endPoint,
    );
  };
}

export function locationDragged(startOrEnd, coords) {
  return async function locationDraggedThunk(dispatch, getState) {
    let { startPoint, endPoint } = getState().locations;

    // This might be a sign that the data format should change... turning a raw
    // pair of coords into something that looks as if we got it from Nominatim.
    const pointFromCoords = { geometry: { coordinates: coords } };

    if (startOrEnd === 'start') startPoint = pointFromCoords;
    else endPoint = pointFromCoords;

    await _setLocationsAndMaybeFetchRoute(
      dispatch,
      getState,
      startPoint,
      endPoint,
    );
  };
}

async function _setLocationsAndMaybeFetchRoute(
  dispatch,
  getState,
  startPoint,
  endPoint,
) {
  dispatch({
    type: 'locations_set',
    startPoint,
    endPoint,
  });

  if (startPoint && endPoint) {
    await fetchRoute(
      startPoint.geometry.coordinates,
      endPoint.geometry.coordinates,
    )(dispatch, getState);
  }
}

export function locationInputFocused() {
  return {
    type: 'location_input_focused',
  };
}
