import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import './index.css';
import { BikeHopperClient } from '../../lib/bikehopperClient';
import { delay } from '../../lib/delay';

const limeOptions = { color: 'lime' };

class Map extends React.Component {
  constructor() {
    super();
    this.state = {
      centerPosition: [37.7400, -122.4194],
      demoRoute: [
        [37.736540, -122.420980, false],
        [37.760450, -122.508930, false]
      ],
      lines: []
    };
    this.client = new BikeHopperClient();
  }

  componentDidMount() {
    delay(3000).then(() => this.enableMarker(0))
    .then(() => delay(3000))
    .then(() => this.enableMarker(1))
    .then(() => {
      return this.client.getRoute({
        points:[
          this.state.demoRoute[0].slice(0,2),
          this.state.demoRoute[1].slice(0,2)
        ],
        optimize: false,
        pointsEncoded: false
      });
    })
    .then(route => {
      this.setState({
        lines: route.paths.map((p => p.points.coordinates))
      });
    });
  }

  render() {
    return (
      <MapContainer center={this.state.centerPosition} zoom={12} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {this.state.lines.map((pl, idx) => (
          <Polyline key={'p'+idx} pathOptions={limeOptions} positions={pl} />
        ))}

        {this.state.demoRoute.filter(i => i[2]).map((item, idx) => (
          <Marker key={'m'+idx} position={[item[0],item[1]]}></Marker>
        ))}
      </MapContainer>
    );
  }

  enableMarker(markerIndex) {
    this.setState(state => {
      const marker = state.demoRoute[markerIndex];
      marker[2] = true;
      state.demoRoute[markerIndex] = marker;
      return {
        demoRoute: state.demoRoute
      }
    });
  }
}

export { Map }
