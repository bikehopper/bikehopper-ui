# Getting Started With The BikeHopper UI

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). You can find the original CRA [readme here](create-react-app-readme.md). To get started clone this repo, run `npm install`, then run `npm start`.

Requests to `localhost` are proxied to https://api.bikehopper.staging.techlabor.org. This is configured by the "proxy" property in the package.json of this repo. Presently there is a thin client library at `src/lib/bikehopperClient.js` with one method for one endpoint. More methods should be added as needed. This library calls the Bikehopper [backend](https://github.com/bikehopper/bikehopper-web-app).
