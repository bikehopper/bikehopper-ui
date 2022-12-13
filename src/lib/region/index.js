// As I write this comment, we only actively support the Bay Area. The point of
// this file is to centralize all region-specific assumptions made on the
// frontend in one place, so we can more easily modularize and support more
// regions in the future.

import {
  SUPPORTED_REGION_DISPLAY,
  DEFAULT_VIEWPORT_BOUNDS,
  AGENCY_COMMON_NAMES,
  TRANSIT_SERVICE_AREA,
} from './BayArea';

export {
  SUPPORTED_REGION_DISPLAY,
  DEFAULT_VIEWPORT_BOUNDS,
  TRANSIT_SERVICE_AREA,
};

export function getAgencyDisplayName(gtfsAgencyName) {
  return AGENCY_COMMON_NAMES[gtfsAgencyName] || gtfsAgencyName;
}
