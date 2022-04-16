import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import BikehopperMap from './BikehopperMap';
import BottomPane from './BottomPane';
import DirectionsNullState from './DirectionsNullState';
import RoutesOverview from './RoutesOverview';
import SearchAutocompleteDropdown from './SearchAutocompleteDropdown';
import TopBar from './TopBar';
import MapOverlay from './MapOverlay';
import classnames from 'classnames';
import {
  LocationSourceType,
  locationInputFocused,
} from '../features/locations';
import * as VisualViewportTracker from '../lib/VisualViewportTracker';

import './App.css';

function App() {
  const { hasRoutes, hasLocations, isEditingLocations } = useSelector(
    (state) => ({
      hasLocations: !!(
        state.locations.end ||
        (state.locations.start &&
          state.locations.start.source !== LocationSourceType.UserGeolocation)
      ),
      hasRoutes: !!state.routes.routes,
      isEditingLocations: state.locations.editingLocation != null,
    }),
    shallowEqual,
  );

  const dispatch = useDispatch();

  const [interactingWithMap, setInteractingWithMap] = React.useState(false);

  const mapRef = React.useRef();

  const handleBottomInputFocus = (evt) => {
    dispatch(locationInputFocused('end'));
  };

  var lastX = 0,
    lastY = 0;

  const handleMapTouchEvent = (evt) => {
    mapRef.current.getContainer().focus();
    evt.preventDefault();
    evt.stopPropagation();

    if (evt.type == 'touchstart') {
      setInteractingWithMap(true);
    } else if (evt.type == 'touchend' || evt.type == 'touchcancel') {
      setInteractingWithMap(false);
    }

    var target = mapRef.current.getCanvas();

    var options = { bubbles: true };

    if (evt.touches && evt.touches.length > 0) {
      options.touches = [];
      for (var i = 0; i < evt.touches.length; i++) {
        options.touches.push(
          new Touch({
            identifier: 0,
            target,
            clientX: evt.touches[i].clientX,
            clientY: evt.touches[i].clientY,
          }),
        );
      }

      console.log(options.touches);
    }

    target.dispatchEvent(new TouchEvent(evt.type, options));
  };

  const showMap = !isEditingLocations;

  // iOS hack: Shrink body when Safari virtual keyboard is hiding content, so
  // you can't be scrolled down.
  React.useEffect(() => {
    if (VisualViewportTracker.isSupported()) {
      VisualViewportTracker.listen((height) => {
        document.body.style.height = `${height}px`;
      });
    }
  }, []);

  return (
    <div className="App">
      <BikehopperMap hidden={!showMap} ref={mapRef} />
      <div
        className={classnames({
          App_column: true,
          App_column__interactingWithMap: interactingWithMap,
        })}
      >
        <TopBar
          showSearchBar={isEditingLocations || hasLocations || hasRoutes}
          initiallyFocusDestination={isEditingLocations}
        />
        {!isEditingLocations && (
          <MapOverlay
            onMapTouchStart={handleMapTouchEvent}
            onMapTouchMove={handleMapTouchEvent}
            onMapTouchEnd={handleMapTouchEvent}
            onMapTouchCancel={handleMapTouchEvent}
          >
            {hasRoutes ? (
              <RoutesOverview />
            ) : hasLocations ? null : (
              <DirectionsNullState onInputFocus={handleBottomInputFocus} />
            )}
          </MapOverlay>
        )}
        {isEditingLocations && <SearchAutocompleteDropdown />}
      </div>
    </div>
  );
}

export default App;
