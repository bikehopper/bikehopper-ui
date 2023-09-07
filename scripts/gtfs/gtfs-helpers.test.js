import { expect, test, describe, vi } from 'vitest';
const { filterRouteIds, filterTripIds, getInterestingStopIds, getInterestingStopsAsGeoJsonPoints } = require('./gtfs-helpers');
const configs = require('./configs.json');
const { PassThrough } = require('stream');

vi.mock('node:fs/promises');

describe('#filterRouteIds', async () => {
  test('should select all the IDs that have a matching prefix', async () => {
    const mockReadable = new PassThrough();
    const actualPromise = filterRouteIds(new Set(configs.filteredAgencyIds), new Set(configs.manuallyFilteredRouteIds), mockReadable);

    setTimeout(() => {
      mockReadable.emit('data', 'route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url,route_color,route_text_color,route_sort_order,continuous_pickup,continuous_drop_off,network_id,as_route\n');
      mockReadable.emit('data', 'UC:1,UC,1,Delores,"Union Landing, Four Corners, Dyer & Union City Blvd, and Union City BART",3,,3ab859,ffffff,0,,,UC,\n');
      mockReadable.emit('data', 'CE:ACE,CE,ACE,Altamont Corridor Express,,2,https://acerail.com/schedules/,bd10e0,FFFFFF,0,,,CE,\n');
      mockReadable.emit('data', 'AM:CC,AM,CC,Capitol Corridor,"Daily train service between Auburn, Sacramento, Oakland and San Jose",2,http://capitolcorridor.org/route_and_schedules,,,0,,,AM,1\n');
      mockReadable.emit('end');
    }, 1);

    await expect(actualPromise).resolves.toStrictEqual(new Set(['CE:ACE', 'AM:CC', 'ST:B']));
  });
});

test('#filterTripIds', async () => {
  const mockReadable = new PassThrough();
  const filteredRouteIds = new Set(['CE:ACE', 'AM:CC', 'AM:SF', 'ST:B']);
  const actualPromise = filterTripIds(filteredRouteIds, mockReadable);
  const expectedIds = new Set(["AM:545W", "CE:ACE 01", "CE:ACE 01.1"]);

  setTimeout(() => {
    mockReadable.emit('data', 'route_id,service_id,trip_id,trip_headsign,trip_short_name,direction_id,block_id,shape_id,wheelchair_accessible,bikes_allowed\n');
    mockReadable.emit('data', 'UC:1,UC:76872,UC:5554536,Dyer & UC Blvd,,0,UC:20001,UC:p_1274523,0,0\n');
    mockReadable.emit('data', 'CE:ACE,CE:78418,CE:ACE 01,San Jose,ACE 1,0,CE:100,CE:r9ei,1,0\n');
    mockReadable.emit('data', 'CE:ACE,CE:77596,CE:ACE 01.1,San Jose,ACE 1,0,CE:101,CE:r9ei,0,0\n');
    mockReadable.emit('data', 'AM:SF,AM:72761,AM:545W,San Francisco - Transbay Terminal,,1,,AM:77ej,1,0\n');
    mockReadable.emit('end');
  }, 1);

  await expect(actualPromise).resolves.toStrictEqual(expectedIds);
});

test('#getInterestingStopIds', async () => {
  const mockReadable = new PassThrough();
  const filteredTripIds = new Set(["AM:545W", "CE:ACE 01", "CE:ACE 01.1"]);
  const result = getInterestingStopIds(filteredTripIds, mockReadable);

  setTimeout(() => {
    mockReadable.emit('data', 'trip_id,stop_id,stop_sequence,stop_headsign,arrival_time,departure_time,pickup_type,drop_off_type,continuous_pickup,continuous_drop_off,shape_dist_traveled,timepoint\n');
    mockReadable.emit('data', 'UC:5554536,79221,0,,04:30:00,04:30:00,0,0,,,0.00000,1\n');
    mockReadable.emit('data', 'UC:5554536,79216,1,,04:30:52,04:30:52,0,0,,,338.55816,0\n');
    mockReadable.emit('end');
  }, 1);

  // using the hash because the data set is too big
  await expect(result).resolves.toStrictEqual(new Set(["79221","79216"]));
});

test('#getInterestingStopsAsGeoJsonPoints', async () => {
  const mockReadable = new PassThrough();
  const interestingStopIds = new Set(["866010","MB:2452892"]);
  const result = getInterestingStopsAsGeoJsonPoints(interestingStopIds, mockReadable);

  setTimeout(() => {
    mockReadable.emit('data', 'stop_id,stop_name,stop_code,stop_desc,stop_lat,stop_lon,zone_id,stop_url,tts_stop_name,platform_code,location_type,parent_station,stop_timezone,wheelchair_boarding,level_id\n');
    mockReadable.emit('data', 'mtc:powell,Powell,,,37.7845934063206,-122.407373344056,,,,,1,,America/Los_Angeles,0,\n');
    mockReadable.emit('data', 'MB:2452892,Owens Street and Gene Friend Way,2452892,,37.768331186,-122.3948415497,,,,,0,,America/Los_Angeles,0,\n');
    mockReadable.emit('data', '866010,Shoreline @ Terra Bella,866010,,37.4082669632,-122.0779402542,,,,,0,,America/Los_Angeles,1,');
    mockReadable.emit('end')
  }, 1);

  await expect(result).resolves.toStrictEqual([{"geometry": {"coordinates": [-122.3948415497,37.768331186],"type": "Point"},"properties": {"name": "Owens Street and Gene Friend Way (MB:2452892)"},"type": "Feature"},{"geometry": {"coordinates": [-122.0779402542,37.4082669632],"type": "Point"},"properties": {"name": "Shoreline @ Terra Bella (866010)"},"type": "Feature"}]);
});
