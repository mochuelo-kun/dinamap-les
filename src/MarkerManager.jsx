import React, { useState, useEffect } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon, Fill, Stroke, Text } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import { MARKER_TYPES } from './markerUtils';

const MARKER_STYLES = {
  [MARKER_TYPES.CORAL_TABLE]: new Style({
    image: new Icon({
      src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#ff6b35" stroke="#fff" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-family="Arial" font-size="12">🪸</text>
        </svg>
      `),
      scale: 1.2
    }),
    text: new Text({
      offsetY: -30,
      fill: new Fill({ color: '#000' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
      font: '12px Arial'
    })
  }),
  [MARKER_TYPES.NATURAL_FEATURE]: new Style({
    image: new Icon({
      src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#2ecc71" stroke="#fff" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-family="Arial" font-size="12">🐠</text>
        </svg>
      `),
      scale: 1.2
    }),
    text: new Text({
      offsetY: -30,
      fill: new Fill({ color: '#000' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
      font: '12px Arial'
    })
  }),
  [MARKER_TYPES.MONITORING_POINT]: new Style({
    image: new Icon({
      src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#3498db" stroke="#fff" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-family="Arial" font-size="12">📊</text>
        </svg>
      `),
      scale: 1.2
    }),
    text: new Text({
      offsetY: -30,
      fill: new Fill({ color: '#000' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
      font: '12px Arial'
    })
  }),
  [MARKER_TYPES.OTHER]: new Style({
    image: new Icon({
      src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#9b59b6" stroke="#fff" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-family="Arial" font-size="12">📍</text>
        </svg>
      `),
      scale: 1.2
    }),
    text: new Text({
      offsetY: -30,
      fill: new Fill({ color: '#000' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
      font: '12px Arial'
    })
  })
};

const createMarkerFeature = (marker) => {
  const feature = new Feature({
    geometry: new Point(fromLonLat([marker.longitude, marker.latitude])),
    markerId: marker.id,
    markerData: marker
  });
  
  const style = MARKER_STYLES[marker.type].clone();
  if (marker.label) {
    style.getText().setText(marker.label);
  }
  
  feature.setStyle(style);
  return feature;
};


const MarkerManager = ({ map, markers, onMarkerClick }) => {
  const [markerLayer, setMarkerLayer] = useState(null);

  useEffect(() => {
    if (!map) return;

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 1000
    });

    map.addLayer(vectorLayer);
    setMarkerLayer(vectorLayer);

    const handleMapClick = (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
        return feature.get('markerId') ? feature : null;
      });

      if (feature && onMarkerClick) {
        onMarkerClick(feature.get('markerData'));
      }
    };

    map.on('singleclick', handleMapClick);

    return () => {
      map.removeLayer(vectorLayer);
      map.un('singleclick', handleMapClick);
    };
  }, [map, onMarkerClick]);

  useEffect(() => {
    if (!markerLayer || !markers) return;

    const source = markerLayer.getSource();
    source.clear();

    markers.forEach(marker => {
      const feature = createMarkerFeature(marker);
      source.addFeature(feature);
    });
  }, [markerLayer, markers]);

  return null;
};

export default MarkerManager;