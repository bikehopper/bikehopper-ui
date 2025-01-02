import { MapRefs } from '../hooks/useMapRefs';
import { HtmlPortalNode, OutPortal } from 'react-reverse-portal';

import useIsMobile from '../hooks/useScreenWidth';
import React, { useEffect } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';

type Props = {
  header: React.ReactNode;
  infoBox?: React.ReactNode;
  mapRefs: MapRefs;
  mapPortal: HtmlPortalNode;
  loading: boolean;
};

export default function DesktopMapLayout({
  header,
  infoBox,
  mapRefs,
  mapPortal,
  loading,
}: Props) {
  const isMobile = useIsMobile();

  const { mapRef, mapControlTopLeftRef, mapControlTopRightRef } = mapRefs;

  const updateMapTopControls = () => {
    if (
      !mapRef.current ||
      !mapControlTopLeftRef.current ||
      !mapControlTopRightRef.current
    ) {
      return;
    }

    mapControlTopLeftRef.current.style.transform = 'translate3d(0,0,0)';
    mapControlTopRightRef.current.style.transform = 'translate3d(0,0,0)';
  };

  useEffect(() => {
    if (!isMobile) {
      updateMapTopControls();
    }
  }, [isMobile]);

  return (
    <div className="overflow-hidden flex w-full h-full flex-row flex-nowrap">
      <div className="flex h-full flex-col overflow-y-auto basis-[400px]">
        {header}
        <div className="z-10">{infoBox}</div>
        <div className="pointer-events-none flex w-full h-full items-center justify-center z-0">
          <MoonLoader loading={!infoBox && loading} size={60} />
        </div>
      </div>
      <div className="flex grow h-full overflow-hidden">
        <OutPortal node={mapPortal} isMobile={false} />
      </div>
    </div>
  );
}
