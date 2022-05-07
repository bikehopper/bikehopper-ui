# Getting Started With The BikeHopper UI

This project was bootstrapped with [Create React
App](https://github.com/facebook/create-react-app). You can find the original
CRA [readme here](create-react-app-readme.md). To get started clone this repo,
copy the `.env.development.template` to `.env.development.local` and put in a
Mapbox token you create (free plan is fine), run `npm install`, then run `npm start`.

Requests to `localhost` are proxied to
`https://api-bikehopper-staging.techlabor.org`. This is configured by the "proxy"
property in the package.json of this repo. Presently there is a thin client
library at `src/lib/BikehopperClient.js`. More methods should be added as
needed. This library calls the Bikehopper
[backend](https://github.com/bikehopper/bikehopper-web-app).

If you're actively making changes to [our fork of
GraphHopper](https://github.com/bikehopper/graphhopper), you'll find a variable
you can set in your `.env.development.local` to point to local GraphHopper.
