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
  const [activePath, setActivePath] = useState(0);

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
    if (noPaths()) return null;

    return turf.featureCollection(route.paths.map((path, index) => {
      return path.legs.map((leg => {
        const feature = turf.lineString(leg.geometry.coordinates, { 'route_color': leg['route_color'], 'path_index': index });
        return feature;
      }));
    }).flat());
  };
  const feats = generateGeojson();

  const legColor = () => {
    return ['to-color', ['case',
    ['==', ['get', 'path_index'], activePath], 
      // When path_index === activePath use the color
      ['concat', '#', ['coalesce', ['get', 'route_color'], '007cbf']],
      // Else fallback to grey
      '#BDB8B7'
    ]];
  };

  const updateActivePathOnMap = () => {
    const map = mapRef.current.getMap();
    map.on('idle', () => {
      if (map.getLayer('routeLayer')) {
        map.setPaintProperty('routeLayer', 'line-color', legColor());
        map.setLayoutProperty('routeLayer', 'line-sort-key',
          ['case',
            ['==', ['get', 'path_index'], activePath], 
                9999,
            0
        ]);
      }
    });
  };

  React.useEffect(centerOnBbox, [route]);
  React.useEffect(updateActivePathOnMap, [activePath]);

  const legStyle = {
    id: "routeLayer",
    type: 'line',
    paint: {
      'line-width': 3,
      'line-color': legColor()
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
      interactiveLayerIds={["routeLayer"]}
      onClick={(evt) => {
        if (evt.features && evt.features.length > 0) {
          const feature = evt.features[0];
          setActivePath(feature.properties['path_index']);
        }
      }}
      mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
    >
      <Source id="routeSource" type="geojson" data={feats} >
        <Layer {...legStyle} />
      </Source>
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
