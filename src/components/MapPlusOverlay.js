import Bowser from 'bowser';
import * as React from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import MoonLoader from 'react-spinners/MoonLoader';
import useResizeObserver from '../hooks/useResizeObserver';
import { BOTTOM_DRAWER_DEFAULT_SCROLL } from '../lib/layout';
import BikehopperMap from './BikehopperMap';
import * as VisualViewportTracker from '../lib/VisualViewportTracker';

import './MapPlusOverlay.css';

/*
 * This component renders the map, plus the top bar and bottom drawer.
 *
 * A large amount of the complexity that follows is to manage the drawer at
 * the bottom of the screen that scrolls up. We render the map full-screen,
 * so it doesn't have to resize, and we draw other UI like the top bar and
 * bottom drawer in front of it. We then dynamically reposition the map
 * *controls* to be within the smaller part of the map that's actually
 * visible, which requires tracking the height of the top bar and the
 * scroll position of the bottom drawer.
 */

const _isTouch = 'ontouchstart' in window;

function MapPlusOverlay(props) {
  const { bottomContent, topContent, hideMap } = props;
  const loading = useSelector(
    (state) => state.routes.routeStatus === 'fetching',
  );

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

    window.requestAnimationFrame(updateMapBottomControls);
    updateMapTopControls();
  };

  const updateMapTopControls = () => {
    if (
      !mapRef.current ||
      !mapControlTopLeftRef.current ||
      !topContentRef.current
    ) {
      return;
    }
    const topContentHeight =
      topContentRef.current.getBoundingClientRect().height;
    mapControlTopLeftRef.current.style.transform =
      'translate3d(0,' + topContentHeight + 'px,0)';
    mapControlTopRightRef.current.style.transform =
      'translate3d(0,' + topContentHeight + 'px,0)';
  };

  const columnRef = React.useRef();

  // Holds state relating to a series of touch events (touchstart -> 0 to many
  // touchmove -> touchcancel or touchend).
  const mapTouchStateRef = React.useRef();

  const handleMapTouchEvent = (eventName, evt) => {
    // On mobile, when you think you're touching the map, you are actually touching a
    // transparent <div/> placed in front of the map. This function creates synthetic
    // touch events (and in some cases, click events) and forwards them to the map, or
    // to markers, controls and other things on the map.

    if (!mapRef.current) return;
    mapRef.current.getContainer().focus();
    evt.preventDefault();

    const options = { bubbles: true };

    if (eventName === 'touchstart') {
      mapTouchStateRef.current = {
        startClientX: evt.touches[0].clientX,
        startClientY: evt.touches[0].clientY,
        lastScreenX: evt.touches[0].screenX,
        lastScreenY: evt.touches[0].screenY,
        lastClientX: evt.touches[0].clientX,
        lastClientY: evt.touches[0].clientY,
        numTouches: evt.touches.length,
      };
      const mapCanvas = mapRef.current.getCanvas();

      // You may not want to touch the map itself, but a marker or control on
      // the map. Here, we figure out what element would have been touched, if
      // there hadn't been a transparent <div/> in the way.
      columnRef.current.style.pointerEvents = 'none';
      mapTouchStateRef.current.target =
        document.elementFromPoint(
          evt.touches[0].clientX,
          evt.touches[0].clientY,
        ) || mapCanvas;
      columnRef.current.style.pointerEvents = '';
    } else if (!mapTouchStateRef.current) {
      console.error('unexpected touch'); // XXX remove if not happening
      return;
    }

    if (eventName === 'touchmove') {
      mapTouchStateRef.current.lastClientX = evt.touches[0].clientX;
      mapTouchStateRef.current.lastClientY = evt.touches[0].clientY;
      mapTouchStateRef.current.lastScreenX = evt.touches[0].screenX;
      mapTouchStateRef.current.lastScreenY = evt.touches[0].screenY;
    }

    const mapTouchState = mapTouchStateRef.current;

    const { target } = mapTouchState;

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

    target.dispatchEvent(new TouchEvent(evt.type, options));

    if (eventName === 'touchend') {
      // Also simulate a click event, because map controls and buttons and stuff might need
      // "clicks," not raw touch events, to do things.
      // TODO: We might want to delay to make sure it's not a double-tap-to-zoom?

      const dx = mapTouchState.lastClientX - mapTouchState.startClientX;
      const dy = mapTouchState.lastClientY - mapTouchState.startClientY;
      const distanceMoved = Math.sqrt(dx * dx + dy * dy);
      if (distanceMoved > 7) return; // more of a drag than a click

      const syntheticEvent = new MouseEvent('click', {
        bubbles: true, // might click on a <span> inside of a <button>, etc
        screenX: mapTouchState.lastScreenX,
        screenY: mapTouchState.lastScreenY,
        clientX: mapTouchState.lastClientX,
        clientY: mapTouchState.lastClientY,
        // Treat as right click if 2 or more touches.
        // I don't know if this is correct or useful.
        button: mapTouchState.numTouches.length > 1 ? 2 : 0,
        buttons: mapTouchState.numTouches.length > 1 ? 2 : 1,
      });
      target.dispatchEvent(syntheticEvent);
    }

    if (eventName === 'touchend' || eventName === 'touchcancel') {
      mapTouchStateRef.current = null;
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

  const topContentRef = React.useRef();
  React.useLayoutEffect(() => {
    if (!mapRef.current) return;
    updateMapTopControls();
  });

  const updateMapBottomControls = () => {
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

  // Update the positioning of the map's bottom-left and bottom-right controls
  // when the bottom pane resizes under them, scrolls, or when this component
  // rerenders.
  const bottomPaneRef = useResizeObserver(updateMapBottomControls);
  const handleMapOverlayScroll = (evt) => {
    window.requestAnimationFrame(updateMapBottomControls);
  };
  React.useLayoutEffect(updateMapBottomControls);

  // For non-touch devices, we use a much simpler method to allow map
  // interaction and scrolling. Instead of forwarding mouse events, we can just
  // enable the bottom drawer to receive mouse events only when the mouse is
  // over it.
  const [isMouseOverBottomPane, setIsMouseOverBottomPane] =
    React.useState(false);
  const handleBottomPaneEnter = setIsMouseOverBottomPane.bind(null, true);
  const handleBottomPaneLeave = setIsMouseOverBottomPane.bind(null, false);

  const mapOverlayRef = React.useRef();

  const hasBottomContentWithMap = Boolean(bottomContent) && !hideMap;

  // When the bottom drawer appears, start it somewhat taller than its minimum height.
  React.useLayoutEffect(() => {
    if (mapOverlayRef.current && hasBottomContentWithMap) {
      mapOverlayRef.current.scrollTop = BOTTOM_DRAWER_DEFAULT_SCROLL;
    }
  }, [hasBottomContentWithMap]);

  // iOS/Android hack: Shrink body when virtual keyboard is hiding content, so
  // you can't be scrolled down.
  const adjustHeightBasedOnVisualViewport = React.useCallback((height) => {
    const isIos = Bowser.parse(navigator.userAgent).os.name === 'iOS';
    if (isIos) {
      // Ignore small discrepancies between visual viewport height and
      // window inner height. If the discrepancy is too small for the
      // virtual keyboard to be up, go back to full height.
      document.body.style.height =
        window.innerHeight > height + 100 ? `${height}px` : '';
    } else {
      // On Android it works better if we always set body height to
      // visual viewport height.
      document.body.style.height = Math.floor(height) + 'px';
    }
  }, []);
  React.useEffect(() => {
    if (VisualViewportTracker.isSupported()) {
      VisualViewportTracker.listen(adjustHeightBasedOnVisualViewport);
      // Make one initial call -- required on Android Chrome so you can scroll
      // to bottom on first load.
      adjustHeightBasedOnVisualViewport(window.visualViewport.height);
    }
  }, [adjustHeightBasedOnVisualViewport]);

  return (
    <div className="MapPlusOverlay">
      <BikehopperMap
        ref={mapRef}
        onMapLoad={handleMapLoad}
        overlayRef={mapOverlayRef}
      />
      <div
        className={classnames({
          MapPlusOverlay_column: true,
          MapPlusOverlay_column__nonTouchDevice: !_isTouch,
          MapPlusOverlay_column__scrollable: isMouseOverBottomPane,
        })}
        ref={columnRef}
      >
        <div ref={topContentRef}>{topContent}</div>
        <div
          className="MapPlusOverlay_overlay"
          ref={mapOverlayRef}
          onScroll={handleMapOverlayScroll}
        >
          {!hideMap && (
            <div
              className="MapPlusOverlay_window"
              ref={mapOverlayTransparentRefCallback}
              onMouseOver={_isTouch ? null : handleBottomPaneLeave}
            />
          )}
          {bottomContent && (
            <div
              className={classnames({
                MapPlusOverlay_bottomPane: true,
                MapPlusOverlay_bottomPane__withMapHidden: hideMap,
              })}
              onMouseEnter={_isTouch ? null : handleBottomPaneEnter}
              onMouseLeave={_isTouch ? null : handleBottomPaneLeave}
              ref={bottomPaneRef}
            >
              {bottomContent}
            </div>
          )}
          <div className="MapPlusOverlay_spinnerContainer">
            <MoonLoader loading={loading && !bottomContent} size={60} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapPlusOverlay;
