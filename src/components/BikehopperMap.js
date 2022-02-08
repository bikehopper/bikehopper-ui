import * as React from 'react';
import { Component } from 'react';
import * as turf from '@turf/helpers';
import MapGL, { Layer, Marker, Source } from 'react-map-gl';
import { getRoute } from '../lib/BikehopperClient';
import MarkerSVG from './MarkerSVG';
import SearchBar from './SearchBar';

import 'maplibre-gl/dist/maplibre-gl.css';

const POINTS = [
  [-122.420980, 37.736540], // Start
  [-122.508930, 37.760450], // End
];

class BikehopperMap extends Component {
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
    const newPoints = [event.lngLat, this.state.points[1]];
    this.setState({ points: newPoints });
    this._fetchRoute(newPoints);
  }

  _onEndDragEnd(event, start) {
    const newPoints = [this.state.points[0], event.lngLat];
    this.setState({ points: newPoints });
    this._fetchRoute(newPoints);
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
    this._fetchRoute(newPoints);
  }

  _fetchRoute(points) {
    getRoute({
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
      });
  }

  componentDidMount() {
    this._fetchRoute(this.state.points);
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
          mapStyle="mapbox://styles/mapbox/light-v9"
          onViewportChange={this._handleViewportChange}
          mapboxApiAccessToken={this.props.mapboxApiAccessToken}
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
      </div>
    );
  }
}

export default BikehopperMap;
