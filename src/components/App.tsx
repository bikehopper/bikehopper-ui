import { useEffect, useState, useRef, useMemo } from 'react';
import type { FocusEvent } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { IntlProvider } from 'react-intl';
import type { MessageFormatElement } from 'react-intl';
import type { OnErrorFn } from '@formatjs/intl';
import { Transition } from '@headlessui/react';
import { Provider as ToastProvider } from '@radix-ui/react-toast';
import { createHtmlPortalNode, InPortal } from 'react-reverse-portal';

import DirectionsNullState from './DirectionsNullState';
import Routes from './Routes';
import SearchDropdown from './SearchDropdown';
import Toasts from './Toasts';
import TopBar from './TopBar';
import {
  LocationSourceType,
  enterDestinationFocused,
} from '../features/routeParams';
import { RootState } from '../store';

import './App.css';
import BikeHopperMap from './BikeHopperMap';
import useMapRefs from '../hooks/useMapRefs';
import DesktopMapLayout from './DesktopMapLayout';
import MobileMapLayout from './MobileMapLayout';
import useScreenWidth from '../hooks/useScreenWidth';

type Props = {
  locale: string;
  messages: Record<string, MessageFormatElement[]>;
};

function App(props: Props) {
  const { hasRoutes, hasLocations, editingLocation, viewingDetails } =
    useSelector(
      (state: RootState) => ({
        hasLocations: !!(
          state.routeParams.end ||
          (state.routeParams.start &&
            state.routeParams.start.source !==
              LocationSourceType.UserGeolocation)
        ),
        hasRoutes: !!state.routes.routes,
        editingLocation: state.routeParams.editingLocation,
        viewingDetails: state.routes.viewingDetails,
      }),
      shallowEqual,
    );
  const isEditingLocations = editingLocation != null;

  const loading = useSelector<RootState, boolean>(
    (state) =>
      state.routes.routeStatus === 'fetching' ||
      state.geolocation.geolocationInProgress,
  );

  const dispatch = useDispatch();

  const handleBottomInputFocus = (evt: FocusEvent) => {
    // Scroll up to counteract iOS Safari scrolling down towards the input.
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    evt.preventDefault();
    dispatch(enterDestinationFocused());
  };

  const { isMobile } = useScreenWidth();

  const infoBox = isEditingLocations ? (
    <SearchDropdown startOrEnd={editingLocation} />
  ) : hasRoutes ? (
    <Routes />
  ) : hasLocations ? undefined : (
    <DirectionsNullState onInputFocus={handleBottomInputFocus} />
  );

  const shouldDisplayTopBar = !viewingDetails;
  const [_, setHaveTopBarIncludingFade] = useState(shouldDisplayTopBar);

  const topBar = (
    <TopBar
      showSearchBar={isEditingLocations || hasLocations || hasRoutes}
      initiallyFocusDestination={isEditingLocations}
    />
  );

  const header = isMobile ? (
    <Transition
      as="div"
      show={shouldDisplayTopBar}
      enter="transition-opacity ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      beforeEnter={() => setHaveTopBarIncludingFade(true)}
      afterLeave={() => setHaveTopBarIncludingFade(false)}
    ></Transition>
  ) : shouldDisplayTopBar ? (
    topBar
  ) : null;

  const mapRefs = useMapRefs();

  const mapPortal = useMemo(
    () => createHtmlPortalNode({ attributes: { id: 'map-portal-node' } }),
    [],
  );

  return (
    <IntlProvider
      messages={props.messages}
      locale={props.locale}
      defaultLocale="en"
      onError={import.meta.env.DEV ? handleDebugIntlError : () => {}}
    >
      <InPortal node={mapPortal}>
        <BikeHopperMap
          ref={mapRefs.mapRef}
          onMapLoad={mapRefs.handleMapLoad}
          overlayRef={mapRefs.mapOverlayRef}
          hidden={isMobile && isEditingLocations}
          isMobile={isMobile}
        />
      </InPortal>
      <ToastProvider>
        <div className="App">
          {isMobile ? (
            <MobileMapLayout
              mapPortal={mapPortal}
              mapRefs={mapRefs}
              header={header}
              hideMap={isEditingLocations}
              infoBox={infoBox}
              loading={loading}
            />
          ) : (
            <DesktopMapLayout
              mapPortal={mapPortal}
              header={header}
              infoBox={infoBox}
              mapRefs={mapRefs}
              loading={loading}
            />
          )}

          <Toasts />
        </div>
      </ToastProvider>
    </IntlProvider>
  );
}

const handleDebugIntlError: OnErrorFn = (err) => {
  // By default, react-intl spams the console with "Missing message" errors when you're
  // developing. Suppress these.
  if (err.code === 'MISSING_TRANSLATION') {
    return;
  }
  // Print other errors.
  console.error(err);
};

export default App;
