import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import BikehopperMap from './BikehopperMap';
import BottomPane from './BottomPane';
import DirectionsNullState from './DirectionsNullState';
import RoutesOverview from './RoutesOverview';
import SearchAutocompleteDropdown from './SearchAutocompleteDropdown';
import TopBar from './TopBar';
import classnames from 'classnames';
import useResizeObserver from '../hooks/useResizeObserver';
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

  const mapRef = React.useRef();
  const mapControlBottomLeftRef = React.useRef();
  const mapControlBottomRightRef = React.useRef();
  const mapControlTopLeftRef = React.useRef();
  const mapControlTopRightRef = React.useRef();
  const mapOverlayHeightRef = React.useRef();

  const handleMapLoad = () => {
    mapControlBottomLeftRef.current = document.getElementsByClassName(
      'maplibregl-ctrl-bottom-left',
    )[0];
    mapControlBottomRightRef.current = document.getElementsByClassName(
      'maplibregl-ctrl-bottom-right',
    )[0];
    mapControlTopLeftRef.current = document.getElementsByClassName(
      'maplibregl-ctrl-top-left',
    )[0];
    mapControlTopRightRef.current = document.getElementsByClassName(
      'maplibregl-ctrl-top-right',
    )[0];

    window.requestAnimationFrame(animationUpdate);
    updateMapTopControls(mapOverlayHeightRef.current);
  };

  const updateMapTopControls = (height) => {
    mapOverlayHeightRef.current = height;

    if (!mapControlTopLeftRef.current) {
      return;
    }
    var topBarHeight =
      mapRef.current.getContainer().getBoundingClientRect().height - height;
    mapControlTopLeftRef.current.style.transform =
      'translate3d(0,' + topBarHeight + 'px,0)';
    mapControlTopRightRef.current.style.transform =
      'translate3d(0,' + topBarHeight + 'px,0)';
  };

  const mapOverlayResizeRef = useResizeObserver(
    React.useCallback(([width, height]) => {
      mapOverlayHeightRef.current = height;
      updateMapTopControls(height);
    }, []),
  );

  const handleBottomInputFocus = (evt) => {
    dispatch(locationInputFocused('end'));
  };

  var lastX = 0,
    lastY = 0;

  const handleMapTouchEvent = (evt) => {
    mapRef.current.getContainer().focus();
    evt.preventDefault();

    var target = mapRef.current.getCanvas();

    var options = { bubbles: true };

    if (evt.touches && evt.touches.length > 0) {
      options.touches = [];
      for (var i = 0; i < evt.touches.length; i++) {
        options.touches.push(
          new Touch({
            identifier: i,
            target,
            clientX: evt.touches[i].clientX,
            clientY: evt.touches[i].clientY,
          }),
        );
      }
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

  const mapOverlayTransparentRef = React.useRef();

  React.useEffect(() => {
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(
      (eventName) => {
        mapOverlayTransparentRef.current.addEventListener(
          eventName,
          handleMapTouchEvent,
        );
      },
    );
  }, []);

  const handleMapOverlayScroll = (evt) => {
    window.requestAnimationFrame(animationUpdate);
  };

  const animationUpdate = () => {
    var paneTopY =
      mapOverlayTransparentRef.current.getBoundingClientRect().bottom;
    var mapBottomY = mapRef.current
      .getContainer()
      .getBoundingClientRect().bottom;
    var bottomTranslate = (mapBottomY - paneTopY) * -1;

    if (mapControlBottomLeftRef.current) {
      mapControlBottomLeftRef.current.style.transform =
        'translate3d(0,' + bottomTranslate + 'px,0)';
      mapControlBottomRightRef.current.style.transform =
        'translate3d(0,' + bottomTranslate + 'px,0)';
    }
  };

  return (
    <div className="App">
      <BikehopperMap hidden={!showMap} ref={mapRef} onMapLoad={handleMapLoad} />
      <div className="App_column">
        <TopBar
          showSearchBar={isEditingLocations || hasLocations || hasRoutes}
          initiallyFocusDestination={isEditingLocations}
        />
        {!isEditingLocations && (
          <div
            className="App_mapOverlay"
            onScroll={handleMapOverlayScroll}
            ref={mapOverlayResizeRef}
          >
            <div
              className="App_mapOverlayTransparent"
              ref={mapOverlayTransparentRef}
            ></div>
            <div className="App_mapOverlayBottomPane">
              {hasRoutes ? (
                <RoutesOverview />
              ) : hasLocations ? null : (
                <DirectionsNullState onInputFocus={handleBottomInputFocus} />
              )}
            </div>
          </div>
        )}
        {isEditingLocations && <SearchAutocompleteDropdown />}
      </div>
    </div>
  );
}

export default App;
