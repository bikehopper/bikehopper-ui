import Bowser from 'bowser';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { OutPortal, HtmlPortalNode } from 'react-reverse-portal';
import classnames from 'classnames';
import MoonLoader from 'react-spinners/MoonLoader';

import useResizeObserver from '../hooks/useResizeObserver';
import { BOTTOM_DRAWER_DEFAULT_SCROLL } from '../lib/layout';
import { isTouchMoveSignificant } from '../lib/touch';
import * as VisualViewportTracker from '../lib/VisualViewportTracker';

import './MobileMapLayout.css';
import { MapRefs } from '../hooks/useMapRefs';

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

const TouchEventNames = [
  'touchstart',
  'touchmove',
  'touchend',
  'touchcancel',
] as const;
type TouchEventName = (typeof TouchEventNames)[number];

type MapTouchState = {
  startClientX: number;
  startClientY: number;
  lastScreenX: number;
  lastScreenY: number;
  lastClientX: number;
  lastClientY: number;
  numTouches: number;
  target: HTMLElement;
};

type Props = {
  mapRefs: MapRefs;
  mapPortal: HtmlPortalNode;
  hideMap: boolean;
  header: React.ReactNode;
  infoBox?: React.ReactNode;
  isMapLoaded: boolean;
  loading: boolean;
};

type TouchEventOptions = {
  bubbles: boolean;
  touches?: Touch[];
};

function MobileMapLayout({
  mapPortal,
  infoBox,
  isMapLoaded,
  header,
  hideMap,
  mapRefs,
  loading,
}: Props) {
  const {
    mapRef,
    mapControlBottomLeftRef,
    mapControlBottomRightRef,
    mapControlTopLeftRef,
    mapControlTopRightRef,
    mapOverlayRef,
  } = mapRefs;

  const columnRef = useRef<HTMLDivElement | null>(null);

  // Holds state relating to a series of touch events (touchstart -> 0 to many
  // touchmove -> touchcancel or touchend).
  const mapTouchStateRef = useRef<MapTouchState | null>(null);

  const handleMapTouchEvent = useCallback(
    (eventName: TouchEventName, evt: TouchEvent) => {
      // On mobile, when you think you're touching the map, you are actually touching a
      // transparent <div/> placed in front of the map. This function creates synthetic
      // touch events (and in some cases, click events) and forwards them to the map, or
      // to markers, controls and other things on the map.

      if (!mapRef.current) return;
      mapRef.current.getContainer().focus();
      evt.preventDefault();

      const options: TouchEventOptions = { bubbles: true };

      if (eventName === 'touchstart') {
        const mapCanvas = mapRef.current.getCanvas();

        // You may not want to touch the map itself, but a marker or control on
        // the map. Here, we figure out what element would have been touched, if
        // there hadn't been a transparent <div/> in the way.
        if (columnRef.current) {
          columnRef.current.style.pointerEvents = 'none';
        }

        mapTouchStateRef.current = {
          startClientX: evt.touches[0].clientX,
          startClientY: evt.touches[0].clientY,
          lastScreenX: evt.touches[0].screenX,
          lastScreenY: evt.touches[0].screenY,
          lastClientX: evt.touches[0].clientX,
          lastClientY: evt.touches[0].clientY,
          numTouches: evt.touches.length,
          target:
            (document.elementFromPoint(
              evt.touches[0].clientX,
              evt.touches[0].clientY,
            ) as HTMLElement) || mapCanvas,
        };

        if (columnRef.current) {
          columnRef.current.style.pointerEvents = '';
        }
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

      target?.dispatchEvent(new TouchEvent(evt.type, options));

      if (eventName === 'touchend') {
        // Also simulate a click event, because map controls and buttons and stuff might need
        // "clicks," not raw touch events, to do things.
        // TODO: We might want to delay to make sure it's not a double-tap-to-zoom?

        if (
          isTouchMoveSignificant(
            mapTouchState.startClientX,
            mapTouchState.startClientY,
            mapTouchState.lastClientX,
            mapTouchState.lastClientY,
          )
        ) {
          return; // more of a drag than a click
        }

        const syntheticEvent = new MouseEvent('click', {
          bubbles: true, // might click on a <span> inside of a <button>, etc
          screenX: mapTouchState.lastScreenX,
          screenY: mapTouchState.lastScreenY,
          clientX: mapTouchState.lastClientX,
          clientY: mapTouchState.lastClientY,
          // Treat as right click if 2 or more touches.
          // I don't know if this is correct or useful.
          button: mapTouchState.numTouches > 1 ? 2 : 0,
          buttons: mapTouchState.numTouches > 1 ? 2 : 1,
        });
        target.dispatchEvent(syntheticEvent);
      }

      if (eventName === 'touchend' || eventName === 'touchcancel') {
        mapTouchStateRef.current = null;
      }
    },
    [mapRef, columnRef, mapTouchStateRef],
  );

  const mapOverlayTransparentRef = useRef<HTMLElement | null>(null);
  const mapOverlayTransparentRefCallback = useCallback(
    (node: HTMLElement | null) => {
      if (node) {
        TouchEventNames.forEach((eventName) => {
          node.addEventListener(
            eventName,
            handleMapTouchEvent.bind(null, eventName),
          );
        });
      }
      mapOverlayTransparentRef.current = node;
    },
    [handleMapTouchEvent],
  );

  const topContentRef = useRef<HTMLDivElement | null>(null);

  const updateMapTopControls = useCallback(() => {
    if (
      !mapRef.current ||
      !mapControlTopLeftRef.current ||
      !topContentRef.current ||
      !mapControlTopRightRef.current
    ) {
      return;
    }
    const topContentHeight =
      topContentRef.current.getBoundingClientRect().height;
    mapControlTopLeftRef.current.style.transform =
      'translate3d(0,' + topContentHeight + 'px,0)';
    mapControlTopRightRef.current.style.transform =
      'translate3d(0,' + topContentHeight + 'px,0)';
  }, [mapRef, mapControlTopLeftRef, topContentRef, mapControlTopRightRef]);

  const updateMapBottomControls = useCallback(() => {
    if (!mapRef.current || !mapOverlayTransparentRef.current) return;

    const paneTopY =
      mapOverlayTransparentRef.current.getBoundingClientRect().bottom;
    const mapBottomY = mapRef.current
      .getContainer()
      .getBoundingClientRect().bottom;
    const bottomTranslate = paneTopY - mapBottomY;

    if (mapControlBottomLeftRef.current) {
      mapControlBottomLeftRef.current.style.transform =
        'translate3d(0,' + bottomTranslate + 'px,0)';
    }
    if (mapControlBottomRightRef.current) {
      mapControlBottomRightRef.current.style.transform =
        'translate3d(0,' + bottomTranslate + 'px,0)';
    }
  }, [
    mapRef,
    mapOverlayTransparentRef,
    mapControlBottomLeftRef,
    mapControlBottomRightRef,
  ]);

  useEffect(() => {
    if (!isMapLoaded) return;
    window.requestAnimationFrame(updateMapBottomControls);
    updateMapTopControls();

    const mapControlTopLeft = mapControlTopLeftRef.current;
    const mapControlTopRight = mapControlTopRightRef.current;
    const mapControlBottomLeft = mapControlBottomLeftRef.current;
    const mapControlBottomRight = mapControlBottomRightRef.current;

    return () => {
      if (mapControlTopLeft) {
        mapControlTopLeft.style.transform = '';
      }
      if (mapControlTopRight) {
        mapControlTopRight.style.transform = '';
      }
      if (mapControlBottomLeft) {
        mapControlBottomLeft.style.transform = '';
      }
      if (mapControlBottomRight) {
        mapControlBottomRight.style.transform = '';
      }
    };
  }, [
    isMapLoaded,
    mapControlTopLeftRef,
    mapControlTopRightRef,
    mapControlBottomLeftRef,
    mapControlBottomRightRef,
    updateMapTopControls,
    updateMapBottomControls,
  ]);

  useLayoutEffect(() => {
    if (!mapRef.current) return;
    updateMapTopControls();
  });

  // Update the positioning of the map's bottom-left and bottom-right controls
  // when the bottom pane resizes under them, scrolls, or when this component
  // rerenders.
  const bottomPaneRef = useResizeObserver(updateMapBottomControls);
  const handleMapOverlayScroll = () => {
    window.requestAnimationFrame(updateMapBottomControls);
  };
  useLayoutEffect(updateMapBottomControls);

  // For non-touch devices, we use a much simpler method to allow map
  // interaction and scrolling. Instead of forwarding mouse events, we can just
  // enable the bottom drawer to receive mouse events only when the mouse is
  // over it.
  const [isMouseOverBottomPane, setIsMouseOverBottomPane] = useState(false);
  const handleBottomPaneEnter = setIsMouseOverBottomPane.bind(null, true);
  const handleBottomPaneLeave = setIsMouseOverBottomPane.bind(null, false);

  const hasBottomContentWithMap = Boolean(infoBox) && !hideMap;

  // When the bottom drawer appears, start it somewhat taller than its minimum height.
  useLayoutEffect(() => {
    if (mapOverlayRef.current && hasBottomContentWithMap) {
      mapOverlayRef.current.scrollTop = BOTTOM_DRAWER_DEFAULT_SCROLL;
    }
  }, [mapOverlayRef, hasBottomContentWithMap]);

  // iOS/Android hack: Shrink body when virtual keyboard is hiding content, so
  // you can't be scrolled down.
  const adjustHeightBasedOnVisualViewport = useCallback((height: number) => {
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
  useEffect(() => {
    if (VisualViewportTracker.isSupported()) {
      VisualViewportTracker.listen(adjustHeightBasedOnVisualViewport);
      // Make one initial call -- required on Android Chrome so you can scroll
      // to bottom on first load.
      if (window.visualViewport) {
        adjustHeightBasedOnVisualViewport(window.visualViewport.height);
      }
    }
  }, [adjustHeightBasedOnVisualViewport]);

  return (
    <div className="MobileMapLayout">
      <OutPortal node={mapPortal} isMobile={true} />
      <div
        className={classnames({
          MobileMapLayout_column: true,
          MobileMapLayout_column__nonTouchDevice: !_isTouch,
          MobileMapLayout_column__scrollable: isMouseOverBottomPane,
        })}
        ref={columnRef}
      >
        <div ref={topContentRef}>{header}</div>
        <div
          className="MobileMapLayout_overlay"
          ref={mapOverlayRef}
          onScroll={handleMapOverlayScroll}
        >
          {!hideMap && (
            <div
              className="MobileMapLayout_window"
              ref={mapOverlayTransparentRefCallback}
              onMouseOver={_isTouch ? undefined : handleBottomPaneLeave}
            />
          )}
          {infoBox && (
            <div
              className={classnames({
                MobileMapLayout_bottomPane: true,
                shadow: true,
                MobileMapLayout_bottomPane__withMapHidden: hideMap,
              })}
              onMouseEnter={_isTouch ? undefined : handleBottomPaneEnter}
              onMouseLeave={_isTouch ? undefined : handleBottomPaneLeave}
              ref={bottomPaneRef}
            >
              {infoBox}
            </div>
          )}
          <div className="MobileMapLayout_spinnerContainer">
            <MoonLoader loading={loading && !infoBox} size={60} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileMapLayout;
