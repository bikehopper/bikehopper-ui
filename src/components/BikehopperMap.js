import * as React from 'react';
import { useState, useEffect } from 'react';
import * as turf from '@turf/helpers';
import greatCircle from '@turf/great-circle';
import MapGL, { Layer, Marker, Source } from 'react-map-gl';
import MarkerSVG from './MarkerSVG';

import 'maplibre-gl/dist/maplibre-gl.css';

function BikehopperMap(props) {
  // the callbacks contain event.lngLat for the point, which can replace startPoint/endPoint
  const { startPoint, endPoint, route, onStartPointDrag, onEndPointDrag } = props;

  const mapRef = React.useRef();
  const [activePath, setActivePath] = useState(0);

  const initialViewState = {
    // hardcode San Francisco view for now
    latitude: 37.75117670681911,
    longitude: -122.44574920654225,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  };

  const handleRouteClick = (evt) => {
    if (evt.features?.length) {
      setActivePath(evt.features[0].properties['path_index']);
    }
  };

  // center viewport on route paths
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !route?.paths?.length) return;

    // merge all bboxes
    const bboxes = route.paths.map(path => path.bbox);
    const [minx, miny, maxx, maxy] = bboxes.reduce((acc, cur) => [
      Math.min(acc[0], cur[0]), // minx
      Math.min(acc[1], cur[1]), // miny
      Math.max(acc[2], cur[2]), // maxx
      Math.max(acc[3], cur[3]), // maxy
    ]);

    map.fitBounds([[minx, miny], [maxx, maxy]], {
      padding: 40
    });
  }, [route]);

  const legTransitionHop = (leg, nextLeg) => {
    if (!leg || !nextLeg) return [];

    const start = turf.point(leg.geometry.coordinates[leg.geometry.coordinates.length - 1]);
    const end = turf.point(nextLeg.geometry.coordinates[0]);
    return greatCircle(start, end);
  }

  let routeFeatures = null;
  let transitionFeatures = null;
  if (route?.paths?.length > 0) {
    routeFeatures = turf.featureCollection(
      route.paths.map((path, index) =>
        path.legs.map((leg, legIndex) => {
          if (!transitionFeatures) transitionFeatures = [];
          transitionFeatures.push(legTransitionHop(leg, path.legs[legIndex + 1]));
          return turf.lineString(
            leg.geometry.coordinates,
            {
              route_color: '#' + leg['route_color'],
              path_index: index,
            }
          );
        })
      ).flat()
    );
    transitionFeatures = transitionFeatures && turf.featureCollection(transitionFeatures);
  }

  const legStyle = {
    id: 'routeLayer',
    type: 'line',
    layout: {
      'line-sort-key': getLegSortKey(activePath)
    },
    paint: {
      'line-width': 3,
      'line-color': getLegColorStyle(activePath),
    }
  };
  const transitionStyle = {
    id: 'transitionLayer',
    type: 'line',
    layout: {
      'line-sort-key': getLegSortKey(activePath)
    },
    paint: {
      'line-width': 3,
      'line-color': 'darkgray',
      'line-dasharray': [1, 1],
    }
  }

  return (
    <MapGL
      initialViewState={initialViewState}
      ref={mapRef}
      style={{
        width: '100vw',
        height: '100vh',
      }}
      mapStyle="mapbox://styles/mapbox/light-v9"
      mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
      interactiveLayerIds={['routeLayer']}
      onClick={handleRouteClick}
    >
      <Source id="routeSource" type="geojson" data={routeFeatures}>
        <Layer {...legStyle} />
      </Source>
      <Source id='transitionSource' type='geojson' data={transitionFeatures}>
        <Layer {...transitionStyle} />
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
          <MarkerSVG fillColor="#2fa7cc" />
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
          <MarkerSVG fillColor="#ea526f" />
        </Marker>
      }
    </MapGL>
  );
}

function getLegSortKey(indexOfActivePath) {
  return [
    'case',
    [
      '==',
      [
        'get', 'path_index'
      ],
      indexOfActivePath
    ],
    9999,
    0
  ];
};

function getLegColorStyle(indexOfActivePath) {
  return [
    'case',
    [
      '==',
      [
        'get',
        'path_index',
      ],
      indexOfActivePath
    ],
    // for active path use the route color from GTFS or fallback to blue
    [
      'to-color',
      [
        'get',
        'route_color'
      ],
      'royalblue'
    ],
    // inactive paths are darkgray
    [
      'to-color',
      'darkgray'
    ]
  ];
}

export default BikehopperMap;
