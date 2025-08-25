import React, { useRef, useEffect, useState } from 'react';
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
import FeatureManager from './MarkerManager';
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

const MapComponent = ({ 
  homeLatLng, 
  homeZoom, 
  layers, 
  onCoordinateClick, 
  clickCoordinates, 
  searchCoordinates,
  featuresGeoJSON,
  onFeatureClick,
  addMarkerMode
}) => {
  const mapRef = useRef();
  const [map, setMap] = useState(null);
  const [coordinateMarkerLayer, setCoordinateMarkerLayer] = useState(null);

  useEffect(() => {
    const layerComponents = layers.map(layer => {
      const { url, type, visible, attributionText, attributionUrl, maxZoom } = layer;
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
        throw new Error(`Unknown layer config type: ${type}`);
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


    setMap(olMap);
    setCoordinateMarkerLayer(coordinateMarkerLayerInstance);

    return () => olMap.setTarget(undefined);
  }, [homeLatLng, homeZoom, layers]);

  useEffect(() => {
    if (!map) return;
    layers.forEach(({ visible }, i) => {
      map.getLayers().getArray()[i].setVisible(visible);
    });
  }, [layers, map]);

  useEffect(() => {
    if (!map || !coordinateMarkerLayer) return;

    const source = coordinateMarkerLayer.getSource();
    source.clear();

    if (clickCoordinates) {
      const marker = new Feature({
        geometry: new Point(fromLonLat([clickCoordinates.lng, clickCoordinates.lat])),
      });
      source.addFeature(marker);
    }
  }, [clickCoordinates, map, coordinateMarkerLayer]);

  useEffect(() => {
    if (!map) return;
    
    if (searchCoordinates) {
      const duration = 8000;
      map.getView().animate(
        {
          zoom: 7,
          duration: duration / 4,
        },
        {
          center: fromLonLat([searchCoordinates.lng, searchCoordinates.lat]),
          duration: duration / 2,
        },
        {
          zoom: 13,
          duration: duration / 4,
        },
      );
    }
  }, [searchCoordinates, map]);

  // Handle map clicks separately to avoid re-initialization
  useEffect(() => {
    if (!map) return;

    const handleMapClick = (event) => {
      // Check if clicking on an existing feature
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
        return feature.get('featureId') ? feature : null;
      });

      if (feature && onFeatureClick && !addMarkerMode) {
        // Find the original GeoJSON feature from the data
        const featureId = feature.get('featureId');
        const originalFeature = featuresGeoJSON.features.find(f => f.properties.id === featureId);
        if (originalFeature) {
          onFeatureClick(originalFeature);
        }
        return;
      }

      // Handle coordinate click (for coordinate display or adding features)
      const coordinate = toLonLat(event.coordinate);
      const [lng, lat] = coordinate;
      
      if (onCoordinateClick) {
        onCoordinateClick({ lat, lng });
      }
    };

    map.on('singleclick', handleMapClick);

    return () => {
      map.un('singleclick', handleMapClick);
    };
  }, [map, onCoordinateClick, onFeatureClick, addMarkerMode, featuresGeoJSON]);

  return (
    <>
      <div 
        style={{ 
          height: '100vh', 
          width: '100%',
          cursor: addMarkerMode ? 'crosshair' : 'default'
        }} 
        ref={mapRef}
      />
      <FeatureManager
        map={map}
        featuresGeoJSON={featuresGeoJSON}
        onFeatureClick={onFeatureClick}
      />
    </>
  );
};

export default MapComponent;
