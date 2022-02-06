import * as React from 'react';
import { Component } from 'react';
import ReactDOM from 'react-dom';
import * as turf from '@turf/helpers';
import reportWebVitals from './reportWebVitals';
import MapGL, { Layer, Marker, Source } from 'react-map-gl';
import { BikeHopperClient } from './lib/bikehopperClient';
import MarkerSVG from './components/MarkerSVG';
import SearchBar from './components/SearchBar';

import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';

// restricted public token that is safe to share
const MAPBOX_TOKEN = 'pk.eyJ1IjoiMmpoazNicjJqZXF1IiwiYSI6ImNrejUzM2hxeDBobWYycG8wdzlpb3ppcjUifQ.dgo6QQyOJykr-m-2epbgGw';

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

  _onStartDragEnd = (event) => {
    const newPoints = [event.lngLat, this.state.points[1]];
    this.setState({ points: newPoints });
    this._route(newPoints);
  }

  _onEndDragEnd = (event) => {
    const newPoints = [this.state.points[0], event.lngLat];
    this.setState({ points: newPoints });
    this._route(newPoints);
  }

  _handleViewportChange = (viewport) => {
    this.setState({ viewport });
  }

  _handlePointSearch = (searchString) => {
    let point = searchString.split(',')?.slice(0, 2)?.map(s => s.trim());

    if (!point || !point.length) return;

    for (const i in point) {
      if (isNaN(Number(point[i]))) return;
      point[i] = Number(point[i]);
    }

    const newPoints = [this.state.points[0], point];
    this.setState({ points: newPoints })
    this._route(newPoints);
  }

  _route(points) {
    bikeHopperClient.getRoute({
      points: points.map(crd => crd.slice(0, 2).reverse()),
      optimize: true,
      pointsEncoded: false,
    })
      .then(route => {
        this.setState({
          lines: route.paths.map(path => path.points.coordinates),
          viewport: {
            latitude: (points[0][1] + points[1][1]) / 2,
            longitude: (points[0][0] + points[1][0]) / 2,
            zoom: 12,
            bearing: 0,
            pitch: 0
          }
        });
      })
  }

  render() {
    const layerStyle = {
      id: 'line',
      type: 'line',
      paint: {
        'line-width': 3,
        'line-color': '#007cbf'
      }
    };
    return (
      <div>
        <SearchBar onSubmit={this._handlePointSearch} position='absolute' />
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
          <Marker id='startMarker' longitude={this.state.points[0][0]} latitude={this.state.points[0][1]} draggable={true} onDragEnd={this._onStartDragEnd} offsetLeft={-13} offsetTop={-39}>
            <MarkerSVG />
          </Marker>
          <Marker id='endMarker' longitude={this.state.points[1][0]} latitude={this.state.points[1][1]} draggable={true} onDragEnd={this._onEndDragEnd} offsetLeft={-13} offsetTop={-39}>
            <MarkerSVG />
          </Marker>
        </MapGL ></div>

    );
  }

  componentDidMount() {
    this._route(this.state.points);
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
