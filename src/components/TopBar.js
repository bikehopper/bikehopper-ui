import * as React from 'react';
import SearchBar from './SearchBar';

import './TopBar.css';

export default function TopBar(props) {
  return (
    <div className="TopBar">
      <SearchBar />
    </div>
  );
}
