import * as React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import classnames from 'classnames';
import BikehopperMap from './BikehopperMap';
import DirectionsNullState from './DirectionsNullState';
import RoutesOverview from './RoutesOverview';
import SearchAutocompleteDropdown from './SearchAutocompleteDropdown';
import TopBar from './TopBar';
import {
  LocationSourceType,
  locationInputFocused,
} from '../features/locations';
import * as VisualViewportTracker from '../lib/VisualViewportTracker';

import './App.css';

const _isTouch = 'ontouchstart' in window;

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
    updateMapTopControls();
  };

  const updateMapTopControls = () => {
    if (
      !mapRef.current ||
      !mapControlTopLeftRef.current ||
      !topBarRef.current
    ) {
      return;
    }
    const topBarHeight = topBarRef.current.getBoundingClientRect().height;
    mapControlTopLeftRef.current.style.transform =
      'translate3d(0,' + topBarHeight + 'px,0)';
    mapControlTopRightRef.current.style.transform =
      'translate3d(0,' + topBarHeight + 'px,0)';
  };

  const touchTargetRef = React.useRef();

  const handleMapTouchEvent = (eventName, evt) => {
    if (!mapRef.current) return;
    mapRef.current.getContainer().focus();
    evt.preventDefault();

    const options = { bubbles: true };

    if (eventName === 'touchstart' || !touchTargetRef.current) {
      const mapCanvas = mapRef.current.getCanvas();
      if (evt.touches?.length > 0) {
        columnRef.current.style.pointerEvents = 'none';

        console.log(
          'element at',
          evt.touches[0].clientX,
          evt.touches[0].clientY,
          'is',
          document.elementFromPoint(
            evt.touches[0].clientX,
            evt.touches[0].clientY,
          ),
        );

        touchTargetRef.current =
          document.elementFromPoint(
            evt.touches[0].clientX,
            evt.touches[0].clientY,
          ) || mapCanvas;

        columnRef.current.style.pointerEvents = '';
      } else {
        touchTargetRef.current = mapCanvas;
      }
    }

    const target = touchTargetRef.current;

    if (evt.touches?.length > 0) {
      options.touches = [];
      for (let i = 0; i < evt.touches.length; i++) {
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

    console.log('dispatching to', target);

    target.dispatchEvent(new TouchEvent(evt.type, options));

    if (eventName === 'touchend' || eventName === 'touchcancel') {
      touchTargetRef.current = null;
    }
  };

  const mapOverlayTransparentRef = React.useRef();
  const mapOverlayTransparentRefCallback = React.useCallback((node) => {
    if (node) {
      ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(
        (eventName) => {
          node.addEventListener(
            eventName,
            handleMapTouchEvent.bind(null, eventName),
          );
        },
      );
    }
    mapOverlayTransparentRef.current = node;
  }, []);

  const topBarRef = React.useRef();
  React.useLayoutEffect(() => {
    if (!mapRef.current) return;
    updateMapTopControls();
  });
  const handleBottomInputFocus = (evt) => {
    dispatch(locationInputFocused('end'));
  };

  // iOS hack: Shrink body when Safari virtual keyboard is hiding content, so
  // you can't be scrolled down.
  React.useEffect(() => {
    if (VisualViewportTracker.isSupported()) {
      VisualViewportTracker.listen((height) => {
        document.body.style.height =
          window.innerHeight > height + 100 ? `${height}px` : '';
      });
    }
  }, []);

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

  const [isMouseOverBottomPane, setIsMouseOverBottomPane] =
    React.useState(false);
  const handleBottomPaneEnter = setIsMouseOverBottomPane.bind(null, true);
  const handleBottomPaneLeave = setIsMouseOverBottomPane.bind(null, false);

  const columnRef = React.useRef();

  return (
    <div className="App">
      <BikehopperMap ref={mapRef} onMapLoad={handleMapLoad} />
      <div
        className={classnames({
          App_column: true,
          App_column__nonTouchDevice: !_isTouch,
          App_column__scrollable: isMouseOverBottomPane,
        })}
        ref={columnRef}
      >
        <div ref={topBarRef}>
          <TopBar
            showSearchBar={isEditingLocations || hasLocations || hasRoutes}
            initiallyFocusDestination={isEditingLocations}
          />
        </div>
        <div className="App_mapOverlay" onScroll={handleMapOverlayScroll}>
          {!isEditingLocations && (
            <div
              className="App_mapOverlayTransparent"
              ref={mapOverlayTransparentRefCallback}
            />
          )}
          <div
            className="App_mapOverlayBottomPane"
            onMouseEnter={_isTouch ? null : handleBottomPaneEnter}
            onMouseLeave={_isTouch ? null : handleBottomPaneLeave}
          >
            {bottomContent}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
