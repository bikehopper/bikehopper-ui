import SearchBar from './SearchBar';

import './TopBar.css';

// these strings are explicitly not translated
const BRAND_PART_1 = 'Bike';
const BRAND_PART_2 = 'Hopper';

export default function TopBar({ showSearchBar, initiallyFocusDestination }) {
  const logoAndInfoButton = (
    <div className="mx-3 flex items-center justify-between">
      <span className="TopBar_logo">
        <span className="text-white">{BRAND_PART_1}</span>
        <span className="text-bikehopperyellow">{BRAND_PART_2}</span>
      </span>
      {/* temporarily removed info button until we have something to show */}
    </div>
  );

  return (
    <div
      className="p-3 bg-bikehoppergreen
        flex flex-col pointer-events-auto items-stretch relative"
    >
      {!showSearchBar && logoAndInfoButton}
      {showSearchBar && (
        <SearchBar initiallyFocusDestination={initiallyFocusDestination} />
      )}
    </div>
  );
}
