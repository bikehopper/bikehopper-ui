import { TransitLeg } from './BikeHopperClient';

export function selectAlertsToDisplay(
  leg: TransitLeg,
): [string, string][] | undefined {
  // TODO: Select the alert translation based on locale, instead of always
  // using the first one.
  //
  // Unfortunately, for the Bay Area, no agency seems to actually translate
  // its alerts so it has no impact which is why I've (Scott, April 2023)
  // de-prioritized doing this.
  return leg.alerts?.map((rawAlert) => [
    rawAlert.header_text?.translation[0]?.text,
    rawAlert.description_text?.translation[0]?.text,
  ]);
}
