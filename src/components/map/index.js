import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import './index.css';
import { BikeHopperClient } from '../../lib/bikehopperClient';

const bikeHopperClient = new BikeHopperClient();

function enableMarker(demoRoute, setDemoRoute, markerIndex) {
  demoRoute[markerIndex][2] = true;
  setDemoRoute(demoRoute);
}

function Map() {
  const [centerPosition] = useState([37.7400, -122.4194]);
  const [demoRoute, setDemoRoute] = useState([
    [37.736540, -122.420980, false],
    [37.760450, -122.508930, false]
  ]);
  const [lines, setLines] = useState([]);

  useEffect(() => {
    enableMarker(demoRoute, setDemoRoute, 0);
    enableMarker(demoRoute, setDemoRoute, 1);
  }, [demoRoute, setDemoRoute]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    bikeHopperClient.getRoute({
      points:[
        demoRoute[0].slice(0,2),
        demoRoute[1].slice(0,2)
      ],
      optimize: false,
      pointsEncoded: false,
      signal
    })
    .then(route => {
      console.log('useeffect 2 settingLines...', setLines, route);
      setLines(route.paths.map((p => p.points.coordinates)));
    });

    return () => controller.abort();
  }, [demoRoute, setLines]);

  return (
    <MapContainer center={centerPosition} zoom={12} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Polyline color={'red'} positions={[demoRoute[0].slice(0,2), demoRoute[1].slice(0,2)]} />

      {lines.map((item, idx) => <Polyline key={'p'+idx} color={'lime'} positions={item} />)}

      {demoRoute.filter(i => i[2]).map((item, idx) => (
        <Marker key={'m'+idx} position={[item[0],item[1]]}></Marker>
      ))}
    </MapContainer>
  );
}

export { Map }
