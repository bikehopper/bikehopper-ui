import * as React from 'react';
import SearchBar from './SearchBar';

import './TopBar.css';

export default function TopBar({ showSearchBar, initiallyFocusDestination }) {
  const logoAndInfoButton = (
    <div className="TopBar_logoAndInfoButton">
      <span className="TopBar_logo">
        <span className="TopBar_logoBike">Bike</span>
        <span className="TopBar_logoHopper">Hopper</span>
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
