import React, { useRef, useEffect, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import TileLayer from 'ol/layer/Tile';
import GeoTIFF from 'ol/source/GeoTIFF';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { ScaleLine, defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';
import {
  LAYER_TYPE_OSM,
  LAYER_TYPE_SATELLITE,
  LAYER_TYPE_GEOTIFF,
} from './mapConfig';

const MapComponent = ({ homeLatLng, homeZoom, layers }) => {
  const mapRef = useRef();
  const [map, setMap] = useState(null);

  useEffect(() => {
    const layerComponents = layers.map(layer => {
      const { id, url, type, visible, attributionText, attributionUrl, maxZoom } = layer;
      if (type === LAYER_TYPE_OSM) {
        return new TileLayer({
          source: new OSM(),
          visible: visible,
        });
      } else if (type === LAYER_TYPE_SATELLITE) {
        // const { tileUrl, attributionUrl, attributionText, maxZoom } = layerConfig.metadata;
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
        // console.log(layerConfig);
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

    const olMap = new Map({
      target: mapRef.current,
      layers: layerComponents,
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

    setMap(olMap);

    return () => olMap.setTarget(undefined);
  }, []);

  useEffect(() => {
    if (!map) return;
    layers.forEach(({ id, visible }, i) => {
      map.getLayers().getArray()[i].setVisible(visible);
    });
  }, [layers, map]);


  return <div style={{ height: '100vh', width: '100%' }} ref={mapRef}></div>;
};

export default MapComponent;
