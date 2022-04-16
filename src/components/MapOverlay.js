import * as React from 'react';
import './MapOverlay.css';

export default function MapOverlay(props) {
  const mapOverlayRef = React.useRef();

  React.useEffect(() => {
    mapOverlayRef.current.addEventListener('touchstart', props.onMapTouchStart);
    mapOverlayRef.current.addEventListener('touchmove', props.onMapTouchMove);
    mapOverlayRef.current.addEventListener('touchend', props.onMapTouchEnd);
    mapOverlayRef.current.addEventListener(
      'touchcancel',
      props.onMapTouchCancel,
    );
  });

  return (
    <div className="MapOverlay">
      <div className="MapOverlay_transparent" ref={mapOverlayRef}></div>
      <div className="MapOverlay_bottomPane">{props.children}</div>
    </div>
  );
}
