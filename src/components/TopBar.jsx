import * as React from 'react';
import SearchBar from './SearchBar';

import './TopBar.css';

// these strings are explicitly not translated
const BRAND_PART_1 = 'Bike';
const BRAND_PART_2 = 'Hopper';

export default function TopBar({ showSearchBar, initiallyFocusDestination }) {
  const logoAndInfoButton = (
    <div className="TopBar_logoAndInfoButton">
      <span className="TopBar_logo">
        <span className="TopBar_logoBike">{BRAND_PART_1}</span>
        <span className="TopBar_logoHopper">{BRAND_PART_2}</span>
      </span>
      {/* temporarily removed info button until we have something to show */}
    </div>
  );

  return (
    <div className="TopBar">
      {!showSearchBar && logoAndInfoButton}
      {showSearchBar && (
        <SearchBar initiallyFocusDestination={initiallyFocusDestination} />
      )}
    </div>
  );
}
