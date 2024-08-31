import ItineraryRow from './ItineraryRow';

import './ItinerarySpacer.css';

export default function ItinerarySpacer() {
  return (
    <ItineraryRow>
      {'' /* no content for timeline side of row */}
      <span className="ItinerarySpacer" />
    </ItineraryRow>
  );
}
