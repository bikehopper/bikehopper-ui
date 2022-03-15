import * as React from 'react';
import { useSelector } from 'react-redux';
import BikehopperMap from './BikehopperMap';
import SearchBar from './SearchBar';
import BottomPane from './BottomPane';
import RoutesOverview from './RoutesOverview';

import './App.css';

function App() {
  const hasRoutes = useSelector((state) => !!state.routes.routes);

  return (
    <div className="App">
      <SearchBar />
      <BikehopperMap />
      {hasRoutes && (
        <BottomPane>
          <RoutesOverview />
        </BottomPane>
      )}
    </div>
  );
}

export default App;
