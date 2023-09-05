import { expect, test } from 'vitest';
const { filterRouteIds, filterTripIds, getInterestingStopIds, getInterestingStopsAsGeoJsonPoints } = require('./gtfs-helpers');
const configs = require('./configs.json');

const { parse } = require('csv/sync');
const { readFileSync } = require('fs');
const { createHash } = require('crypto');

const [routesKey, ...routes] = parse(readFileSync('/Users/andy/Desktop/sf-gtfs/routes.txt', 'utf8'));
const [tripsKey, ...trips] = parse(readFileSync('/Users/andy/Desktop/sf-gtfs/trips.txt', 'utf8'));
const [stopTimesKey, ...stopTimes] = parse(readFileSync('/Users/andy/Desktop/sf-gtfs/stop_times.txt', 'utf8'));
const [stopsKey, ...stops] = parse(readFileSync('/Users/andy/Desktop/sf-gtfs/stops.txt', 'utf8'));

test('#filterRouteIds', () => {
  expect(filterRouteIds(new Set(configs.filteredAgencyIds), new Set(configs.manuallyFilteredRouteIds), routesKey, routes)).toStrictEqual(new Set(['CE:ACE', 'AM:SF', 'AM:Shuttle', 'AM:CC', 'ST:B']));
});

test('#filterTripIds', () => {
  const expectedIds = new Set(['CE:ACE 01','CE:ACE 01.1','CE:ACE 03','CE:ACE_300','CE:ACE 03.1','CE:ACE 05','CE:ACE_500','CE:ACE 07','CE:ACE 04','CE:ACE 401','CE:ACE 06','CE:ACE 601','CE:ACE 6.0','CE:ACE 08','CE:ACE 08.0','CE:ACE 10','AM:521W','AM:523W','AM:723W','AM:525W','AM:527W','AM:727W','AM:529W','AM:531W','AM:729W','AM:733W','AM:737W','AM:541W','AM:741W','AM:543W','AM:743W','AM:545W','AM:745W','AM:547W','AM:549W','AM:747W','AM:551W','AM:749W','AM:751W','AM:720E','AM:524E','AM:724E','AM:528E','AM:728E','AM:532E','AM:534E','AM:732E','AM:536E','AM:734E','AM:538E','AM:736E','AM:540E','AM:542E','AM:738E','AM:742E','AM:544E','AM:546E','AM:744E','AM:548E','AM:746E','AM:748E','AM:737S','AM:541S','AM:532S','AM:732S','AM:524S','AM:720S','AM:536S','AM:542S','AM:546S','AM:523S','AM:525S','AM:549S','AM:551S','AM:747S','AM:529','AM:729','AM:538','AM:736','AM:524','AM:724','AM:528','AM:728','AM:532','AM:732','AM:542','AM:742','AM:546','AM:744','AM:748','AM:750','AM:550','AM:521','AM:523','AM:723','AM:527','AM:727','AM:737','AM:541','AM:741','AM:743','AM:547','AM:747','AM:522','AM:720','AM:534','AM:536','AM:734','AM:540','AM:738','AM:544','AM:548','AM:746','AM:733','AM:525','AM:531','AM:543','AM:545','AM:745','AM:549','AM:551','AM:749','AM:751','ST:694','ST:285','ST:695','ST:286','ST:287','ST:288','ST:696','ST:289','ST:697','ST:290','ST:698','ST:710','ST:291','ST:292','ST:293','ST:294','ST:711','ST:295','ST:686','ST:687','ST:688','ST:689','ST:699','ST:700','ST:701','ST:702','ST:703','ST:704','ST:705','ST:707','ST:708','ST:709','ST:692','ST:693','ST:706','ST:690','ST:691']);
  const filteredRouteIds = filterRouteIds(new Set(configs.filteredAgencyIds), new Set(configs.manuallyFilteredRouteIds), routesKey, routes);

  expect(filterTripIds(filteredRouteIds, tripsKey, trips)).toStrictEqual(expectedIds);
});

test('#getInterestingStopIds', () => {
  const filteredRouteIds = filterRouteIds(new Set(configs.filteredAgencyIds), new Set(configs.manuallyFilteredRouteIds), routesKey, routes);
  const filteredTripIds = filterTripIds(filteredRouteIds, tripsKey, trips);
  const result = getInterestingStopIds(stopTimesKey, filteredTripIds, stopTimes);

  // using the hash because the data set is too big
  expect(createHash('md5').update(Buffer.from(Array.from(result))).digest('hex')).toStrictEqual('a52ca8bf82fef746036744d630110a4b');
});

test('#getInterestingStopsAsGeoJsonPoints', () => {
  const filteredRouteIds = filterRouteIds(new Set(configs.filteredAgencyIds), new Set(configs.manuallyFilteredRouteIds), routesKey, routes);
  const filteredTripIds = filterTripIds(filteredRouteIds, tripsKey, trips);
  const interestingStopIds = getInterestingStopIds(stopTimesKey, filteredTripIds, stopTimes);
  const result = getInterestingStopsAsGeoJsonPoints(stopsKey, interestingStopIds, stops);

  expect(createHash('md5').update(Buffer.from(result)).digest('hex')).toStrictEqual('3973efb8526877518e4a7578d6adfe0a');
});
