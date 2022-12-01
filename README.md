# BikeHopper UI

BikeHopper is a navigation app for everything but cars. It gives you
directions that include riding a bike, taking transit, or both. We're
developing and testing in the San Francisco Bay Area, California, but
in principle it could be used anywhere in the world where transit info
is available in GTFS format.

BikeHopper uses:

- [OpenStreetMap](https://openstreetmap.org/) street data
- [Nominatim](https://nominatim.org/) and
  [Photon](https://github.com/komoot/photon) for geocoding
- A [modified version of
  GraphHopper](https://github.com/bikehopper/graphhopper), for routing
  (Thank you to the original
  [GraphHopper](https://www.graphhopper.com/))
- A lightweight Node.js proxy we've written called
  [bikehopper-web-app](https://github.com/bikehopper/bikehopper-web-app)

BikeHopper is free software under the GNU Affero General Public
License, which requires the source to be kept open. We discourage
corporate uses of BikeHopper, but highly encourage self-hosted,
community instances in other regions. Get in touch if you'd like us to
help you be the first region beyond the Bay Area to set one up.

## Getting Started With the BikeHopper UI

This project was bootstrapped with [Create React
App](https://github.com/facebook/create-react-app). You can find the original
CRA [readme here](create-react-app-readme.md). To get started clone this repo,
copy the `.env.development.template` to `.env.development.local` and put in a
Mapbox token you create (free plan is fine), run `npm install`, then run `npm start`.

Requests to `localhost` are proxied to
`https://api-staging.bikehopper.org`. This is configured by the "proxy"
property in the package.json of this repo. Presently there is a thin client
library at `src/lib/BikehopperClient.js`. More methods should be added as
needed. This library calls the Bikehopper
[backend](https://github.com/bikehopper/bikehopper-web-app).

## Configuring local GraphHopper

If you're actively making changes to [our fork of GraphHopper](https://github.com/bikehopper/graphhopper), follow these steps.

1. You'll need a local OSM cutout for Northern California.

    ```sh
    wget http://download.geofabrik.de/north-america/us/california/norcal-latest.osm.pbf
    ```

    Place the OSM cutout at `graphhopper/data/norcal-latest.osm.pbf`.

2. You'll also need GTFS data. Follow steps on this page, under "To Use the Feed and Ask Questions": https://www.interline.io/blog/mtc-regional-gtfs-feed-release/

    Place the GTFS zip file at `graphhopper/data/GTFSTransitData_RG.zip`.

3. Edit the relevant variable in your `.env.development.local` to point to local GraphHopper.
