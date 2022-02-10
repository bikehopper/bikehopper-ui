import * as React from 'react';
import { useState } from 'react';
import * as turf from '@turf/helpers';
import MapGL, { Layer, Marker, Source } from 'react-map-gl';
import MarkerSVG from './MarkerSVG';

import 'maplibre-gl/dist/maplibre-gl.css';

function BikehopperMap(props) {
  // the callbacks contain event.lngLat for the point, which can replace startPoint/endPoint
  const { startPoint, endPoint, route, onStartPointDrag, onEndPointDrag } = props;

  const mapRef = React.useRef();
  const activePath = 0;

  const [viewport, setViewport] = useState({
    // hardcode San Francisco view for now
    latitude: 37.75117670681911,
    longitude: -122.44574920654225,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });

  const noPaths = () => !route || !route.paths || route.paths.length === 0;
  const centerOnBbox = () => {
    const map = mapRef.current.getMap();
    if (noPaths()) return;

    let  [minx, miny, maxx, maxy] = route.paths[0].bbox;
    //merge bboxes across all paths
    for(const path of route.paths) {
      const  [currMinX, currMinY, currMaxX, currMaxY] = path.bbox;
      if (currMinX < minx) minx = currMinX;
      if (currMinY < miny) miny = currMinY;
      if (currMaxX > maxx) maxx = currMaxX;
      if (currMaxY > maxy) maxy = currMaxY;
    }

    const { center: { lng, lat }, zoom } = map.cameraForBounds([[minx, miny], [maxx, maxy]], {
      padding: 40
    });
    setViewport({ latitude: lat, longitude: lng, zoom, bearing: 0, pitch: 0 });
  }

  const generateGeojson = () => {
    if (noPaths()) return;

    return turf.featureCollection(route.paths.map((path, index) => {
      return path.legs.map((leg => turf.lineString(leg.geometry.coordinates, { 'route_color': leg['route_color'], 'path_index': index })));
    }).flat());
  };//path.legs.map((leg => turf.lineString(leg.geometry.coordinates, { 'route_color': leg['route_color'] }))

  //const path = route && route.paths.length > 0 && route.paths[activePath];
  const feats = generateGeojson();

  React.useEffect(centerOnBbox, [route]);

  const legStyle = {
    type: 'line',
    paint: {
      'line-width': 3,
      'line-color': ['to-color', ['concat', '#', ['coalesce', ['get', 'route_color'], '007cbf']]]
    }
  };

  return (
    <MapGL
      {...viewport}
      ref={mapRef}
      width="100vw"
      height="100vh"
      mapStyle="mapbox://styles/mapbox/light-v9"
      onViewportChange={setViewport}
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
    >
      {feats && <Source key="routeSource" type="geojson" data={feats} >
        <Layer key="routeLayer" {...legStyle} />
      </Source>
      }
      {
        startPoint && <Marker
          id='startMarker'
          longitude={startPoint[0]}
          latitude={startPoint[1]}
          draggable={true}
          onDragEnd={onStartPointDrag}
          offsetLeft={-13}
          offsetTop={-39}
        >
          <MarkerSVG />
        </Marker>
      }
      {
        endPoint && <Marker
          id='endMarker'
          longitude={endPoint[0]}
          latitude={endPoint[1]}
          draggable={true}
          onDragEnd={onEndPointDrag}
          offsetLeft={-13}
          offsetTop={-39}
        >
          <MarkerSVG />
        </Marker>
      }
    </MapGL >
  );
}

export default BikehopperMap;
