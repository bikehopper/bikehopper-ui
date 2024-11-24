import { MapRefs } from '../hooks/useMapRefs';
import { HtmlPortalNode, OutPortal } from 'react-reverse-portal';

type Props = {
  sidebar?: JSX.Element;
  mapRefs: MapRefs;
  mapPortal: HtmlPortalNode;
};

import './DesktopMapLayout.css';
import useIsMobile from '../hooks/useIsMobile';
import { useEffect } from 'react';

export default function DesktopMapLayout({
  sidebar,
  mapRefs,
  mapPortal,
}: Props) {
  const hideMap = false;

  const isMobile = useIsMobile();

  const {
    mapRef,
    mapControlBottomLeftRef,
    mapControlBottomRightRef,
    mapControlTopLeftRef,
    mapControlTopRightRef,
  } = mapRefs;

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
      console.log('now Desktop');
      updateMapTopControls();
    }
    return () => console.log('no longer Desktop');
  }, [isMobile]);

  return (
    <div className="DesktopMapLayout">
      <div className="DesktopMapLayout_sidebar">{sidebar}</div>
      <div className="DesktopMapLayout_map">
        <OutPortal node={mapPortal} isMobile={false} />
      </div>
    </div>
  );
}
