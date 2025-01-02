import { MapRefs } from '../hooks/useMapRefs';
import { HtmlPortalNode, OutPortal } from 'react-reverse-portal';

type Props = {
  header: React.ReactNode;
  infoBox?: React.ReactNode;
  mapRefs: MapRefs;
  mapPortal: HtmlPortalNode;
};

import useIsMobile from '../hooks/useScreenWidth';
import React, { useEffect } from 'react';

export default function DesktopMapLayout({
  header,
  infoBox,
  mapRefs,
  mapPortal,
}: Props) {
  const hideMap = false;

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
        {infoBox}
      </div>
      <div className="flex grow h-full overflow-hidden">
        <OutPortal node={mapPortal} isMobile={false} />
      </div>
    </div>
  );
}
