import { MapRefs } from '../hooks/useMapRefs';
import { HtmlPortalNode, OutPortal } from 'react-reverse-portal';

type Props = {
  sidebar?: JSX.Element;
  mapRefs: MapRefs;
  mapPortal: HtmlPortalNode;
};

import './DesktopMapLayout.css';

export default function DesktopMapLayout({ sidebar, mapPortal }: Props) {
  const hideMap = false;

  return (
    <div className="DesktopMapLayout">
      <div className="DesktopMapLayout_sidebar">{sidebar}</div>
      <div className="DesktopMapLayout_map">
        <OutPortal node={mapPortal} />
      </div>
    </div>
  );
}
