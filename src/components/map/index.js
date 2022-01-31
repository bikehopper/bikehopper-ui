import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, LayerGroup, Polyline } from 'react-leaflet';
import { BikeHopperClient } from '../../lib/bikehopperClient';
import './index.css';

const bikeHopperClient = new BikeHopperClient();

function Map() {
  const [centerPosition] = useState([37.7400, -122.4194]);
  const [demoRoute, setDemoRoute] = useState([
    [37.736540, -122.420980, false],
    [37.760450, -122.508930, false]
  ]);
  const demoRouteRef = useRef(demoRoute);
  const [lines, setLines] = useState([]);
  const [toggle, setToggle] = useState(false);

  // Adds markers on a delay to be snazzy
  useEffect(() => {
    setTimeout(() => {
      const updatedRoute = [...demoRouteRef.current];
      updatedRoute[0][2] = true;
      setDemoRoute(updatedRoute);
    }, 2000);
    setTimeout(() => {
      const updatedRoute = [...demoRouteRef.current];
      updatedRoute[1][2] = true;
      setDemoRoute(updatedRoute);
      setToggle(true);
    }, 4000);
  }, [demoRouteRef, setDemoRoute]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    bikeHopperClient.getRoute({
      points:[
        demoRouteRef.current[0].slice(0,2),
        demoRouteRef.current[1].slice(0,2)
      ],
      optimize: true,
      pointsEncoded: false,
      signal
    })
    .then(route => route.paths)
    .then(paths => paths.map((p => p.points.coordinates.map(crd => crd.slice(0,2).reverse()))))
    .then(setLines);

    return () => controller.abort();
  }, [setLines]);

  return (
    <MapContainer center={centerPosition} zoom={12} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LayerGroup>
        {toggle && <Polyline key={`plineofsight`} color={'red'} positions={[demoRouteRef.current[0].slice(0,2), demoRouteRef.current[1].slice(0,2)]} />}
        {toggle && lines.map((line, idx) => <Polyline key={`p${idx}`} color={'green'} positions={line} /> )}
      </LayerGroup>

      {demoRoute.filter(i => i[2]).map((item, idx) => (
        <Marker key={'m'+idx} position={[item[0],item[1]]}></Marker>
      ))}
    </MapContainer>
  );
}

export { Map }
