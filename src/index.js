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
  [-122.420980, 37.736540], // Start
  [-122.508930, 37.760450], // End
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
      },
      points: POINTS,
    };
  }

  _onStartDragEnd(event, end) {
    this.setState({ points: [event.lngLat, end] });
    this._redraw();
  }

  _onEndDragEnd(event, start) {
    this.setState({ points: [start, event.lngLat] });
    this._redraw();
  }

  _handleViewportChange = (viewport) => {
    this.setState({ viewport });
  }

  _redraw() {
    bikeHopperClient.getRoute({
      points: this.state.points.map(crd => crd.slice(0, 2).reverse()),
      optimize: true,
      pointsEncoded: false,
    })
      .then(route => {
        this.setState({ lines: route.paths.map(path => path.points.coordinates) });
      });
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
        onViewportChange={this._handleViewportChange}
        mapboxApiAccessToken={MAPBOX_TOKEN}
      >
        {this.state.lines && <Source type="geojson" data={turf.lineString(this.state.lines[0])}>
          <Layer {...layerStyle} />
        </Source>}
        <Marker id='startMarker' longitude={this.state.points[0][0]} latitude={this.state.points[0][1]} draggable={true} onDragEnd={(event) => this._onStartDragEnd(event, this.state.points[1])} offsetLeft={-13} offsetTop={-39}>
          <MarkerSVG />
        </Marker>
        <Marker id='endMarker' longitude={this.state.points[1][0]} latitude={this.state.points[1][1]} draggable={true} onDragEnd={(event) => this._onEndDragEnd(event, this.state.points[0])} offsetLeft={-13} offsetTop={-39}>
          <MarkerSVG />
        </Marker>
      </MapGL >
    );
  }

  componentDidMount() {
    this._redraw();
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
