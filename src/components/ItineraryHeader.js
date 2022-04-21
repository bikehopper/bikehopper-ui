import * as React from 'react';

import './ItineraryHeader.css';

export default function ItineraryHeader({ children }) {
  return <h3 className="ItineraryHeader">{children}</h3>;
}
