import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import BikehopperMap from './BikehopperMap';
import DirectionsNullState from './DirectionsNullState';
import RoutesOverview from './RoutesOverview';
import SearchAutocompleteDropdown from './SearchAutocompleteDropdown';
import TopBar from './TopBar';
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
    const topBarHeight =
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

  const handleMapOverlayScroll = (evt) => {
    window.requestAnimationFrame(animationUpdate);
  };

  const animationUpdate = () => {
    if (!mapRef.current || !mapOverlayTransparentRef.current) return;

    const paneTopY =
      mapOverlayTransparentRef.current.getBoundingClientRect().bottom;
    const mapBottomY = mapRef.current
      .getContainer()
      .getBoundingClientRect().bottom;
    const bottomTranslate = (mapBottomY - paneTopY) * -1;

    if (mapControlBottomLeftRef.current) {
      mapControlBottomLeftRef.current.style.transform =
        'translate3d(0,' + bottomTranslate + 'px,0)';
      mapControlBottomRightRef.current.style.transform =
        'translate3d(0,' + bottomTranslate + 'px,0)';
    }
  };

  let bottomContent;
  if (isEditingLocations) {
    bottomContent = <SearchAutocompleteDropdown />;
  } else if (hasRoutes) {
    bottomContent = <RoutesOverview />;
  } else if (!hasLocations) {
    bottomContent = (
      <DirectionsNullState onInputFocus={handleBottomInputFocus} />
    );
  }

  return (
    <div className="App">
      <BikehopperMap ref={mapRef} onMapLoad={handleMapLoad} />
      <div className="App_column">
        <TopBar
          showSearchBar={isEditingLocations || hasLocations || hasRoutes}
          initiallyFocusDestination={isEditingLocations}
        />
        <div
          className="App_mapOverlay"
          onScroll={handleMapOverlayScroll}
          ref={mapOverlayResizeRef}
        >
          {!isEditingLocations && (
            <div
              className="App_mapOverlayTransparent"
              ref={mapOverlayTransparentRef}
            />
          )}
          <div className="App_mapOverlayBottomPane">{bottomContent}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
