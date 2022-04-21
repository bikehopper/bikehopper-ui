import * as React from 'react';
import RouteSummary from './RouteSummary';
import SelectionList from './SelectionList';
import SelectionListItem from './SelectionListItem';

export default function RoutesOverview(props) {
  const { routes, activeRoute, onRouteClick } = props;

  return (
    <SelectionList>
      {routes.map((route, index) => (
        <SelectionListItem
          active={activeRoute === index}
          onClick={onRouteClick.bind(null, index)}
          key={route.nonce}
        >
          <RouteSummary route={route} />
        </SelectionListItem>
      ))}
    </SelectionList>
  );
}
