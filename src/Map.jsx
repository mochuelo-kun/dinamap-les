import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import GeoTIFF from 'ol/source/GeoTIFF';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Text, Fill, Stroke } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { ScaleLine, defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';
import './Map.css';
import {
  LAYER_TYPE_OSM,
  LAYER_TYPE_SATELLITE,
  LAYER_TYPE_GEOTIFF,
} from './mapConfig';

const COORDINATE_MARKER_STYLE = new Style({
  text: new Text({
    text: '⌖',
    font: 'bold 28px sans-serif',
    fill: new Fill({ color: '#ffffff' }),
    stroke: new Stroke({ color: '#000000', width: 3 }),
    offsetY: 0,
  }),
});

const MapComponent = ({ homeLatLng, homeZoom, layers, onCoordinateClick, coordinates }) => {
  const mapRef = useRef();
  const [map, setMap] = useState(null);
  const [coordinateMarkerLayer, setCoordinateMarkerLayer] = useState(null);

  useEffect(() => {
    const layerComponents = layers.map(layer => {
      const { id, url, type, visible, attributionText, attributionUrl, maxZoom } = layer;
      if (type === LAYER_TYPE_OSM) {
        return new TileLayer({
          source: new OSM(),
          visible: visible,
        });
      } else if (type === LAYER_TYPE_SATELLITE) {
        return new TileLayer({
          source: new XYZ({
            url: url,
            attributions:
              `Tiles © <a href=${attributionUrl}>${attributionText}</a>`,
            maxZoom: maxZoom,

          }),
          visible: visible,
        })
      } else if (type === LAYER_TYPE_GEOTIFF) {
        return new WebGLTileLayer({
          visible: visible,
          source: new GeoTIFF({
            sources: [{ url: url }],
            attributions:
              `Tiles © <a href=${attributionUrl}>${attributionText}</a>`,
          })
        })
      } else {
        throw `Unknown layer config type: ${type} (id: ${id})`;
      }
    });

    const coordinateMarkerSource = new VectorSource();
    const coordinateMarkerLayerInstance = new VectorLayer({
      source: coordinateMarkerSource,
      style: COORDINATE_MARKER_STYLE,
    });

    const olMap = new Map({
      target: mapRef.current,
      layers: [...layerComponents, coordinateMarkerLayerInstance],
      view: new View({
        center: fromLonLat(homeLatLng),
        zoom: homeZoom,
        // allow user to zoom as deep as they want into geotiffs
        maxZoom: undefined,
      }),
      controls: defaultControls().extend([
        new ScaleLine({
          units: 'metric',
          bar: true,
          steps: 6,
          // text: true,
          minWidth: 180,
        }),
      ]),
    });

    olMap.on('singleclick', (event) => {
      const coordinate = toLonLat(event.coordinate);
      const [lng, lat] = coordinate;
      
      if (onCoordinateClick) {
        onCoordinateClick({ lat, lng });
      }
    });

    setMap(olMap);
    setCoordinateMarkerLayer(coordinateMarkerLayerInstance);

    return () => olMap.setTarget(undefined);
  }, []);

  useEffect(() => {
    if (!map) return;
    layers.forEach(({ id, visible }, i) => {
      map.getLayers().getArray()[i].setVisible(visible);
    });
  }, [layers, map]);

  useEffect(() => {
    if (coordinateMarkerLayer) {
      if (coordinates) {
        coordinateMarkerLayer.getSource().clear();
        const coordinateMarker = new Feature({
          geometry: new Point(fromLonLat([coordinates.lng, coordinates.lat])),
        });
        coordinateMarkerLayer.getSource().addFeature(coordinateMarker);
      } else {
        coordinateMarkerLayer.getSource().clear();
      }
    }
  }, [coordinates, coordinateMarkerLayer]);

  return <div style={{ height: '100vh', width: '100%' }} ref={mapRef}></div>;
};

export default MapComponent;
