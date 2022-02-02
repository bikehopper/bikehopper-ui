import * as React from 'react';
import { Component } from 'react';
import ReactDOM from 'react-dom';
import * as turf from '@turf/helpers';
import reportWebVitals from './reportWebVitals';
import MapGL, { Layer, Marker, Source } from 'react-map-gl';
import { BikeHopperClient } from './lib/bikehopperClient';
import MarkerSVG from './components/MarkerSVG';

import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA'; // Set your mapbox token here

const bikeHopperClient = new BikeHopperClient();

const POINTS = [
  [-122.420980, 37.736540],
  [-122.508930, 37.760450],
];

class Root extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        latitude: (POINTS[0][1] + POINTS[1][1]) / 2,
        longitude: (POINTS[0][0] + POINTS[1][0]) / 2,
        zoom: 12,
        bearing: 0,
        pitch: 0
      }
    };
  }

  render() {
    const layerStyle = {
      id: 'point',
      type: 'line',
      paint: {
        'line-width': 3,
        'line-color': '#007cbf'
      }
    };
    return (
      <MapGL
        {...this.state.viewport}
        width="100vw"
        height="100vh"
        mapStyle="mapbox://styles/mapbox/dark-v9"
        onViewportChange={viewport => this.setState({ viewport })}
        mapboxApiAccessToken={MAPBOX_TOKEN}
      >

        {this.state.lines && <Source id="my-data" type="geojson" data={turf.lineString(this.state.lines[0])}>
          <Layer {...layerStyle} />
        </Source>}
        <Marker longitude={POINTS[0][0]} latitude={POINTS[0][1]} offsetLeft={-13} offsetTop={-39}>
          <MarkerSVG />
        </Marker>
        <Marker longitude={POINTS[1][0]} latitude={POINTS[1][1]} offsetLeft={-13} offsetTop={-39}>
          <MarkerSVG />
        </Marker>
      </MapGL>
    );
  }

  componentDidMount() {
    bikeHopperClient.getRoute({
      points: POINTS.map(crd => crd.slice(0, 2).reverse()),
      optimize: true,
      pointsEncoded: false,
    })
      .then(route => route.paths)
      .then(paths => paths.map((p => p.points.coordinates)))
      .then(lines => this.setState({ lines }));
  }
}

ReactDOM.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
