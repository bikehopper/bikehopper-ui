import * as React from 'react';

export function SupportedRegionText(props) {
  // TODO: localize
  return (
    <span>
      the <strong>Los Angeles</strong> metro
    </span>
  );
}

// latitude 33.930742
// longitude -118.232976
// zoom 9.2

// top left: lat 34.19, long -118.61
// lower right: lat 33.77, long -117.98

export const DEFAULT_VIEWPORT_BOUNDS = [-118.61, 33.77, -117.98, 34.19];

export const AGENCY_COMMON_NAMES = {
  //'Chicago Transit Authority': 'CTA',
};

export const TRANSIT_SERVICE_AREA = null; // TODO
export const TRANSIT_DATA_ACKNOWLEDGEMENT = null; // TODO: is one required?
