import React, { useState, useEffect } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style';

const FEATURE_STYLE = new Style({
  fill: new Fill({
    color: 'rgba(0, 0, 0, 0)' // No fill - transparent
  }),
  stroke: new Stroke({
    color: '#ffff00', // Yellow border
    width: 2
  }),
});

const MARKER_STYLE = new Style({
  text: new Text({
    text: '⌖',
    font: 'bold 24px sans-serif',
    fill: new Fill({ color: '#ffff00' }),
    stroke: new Stroke({ color: '#000000', width: 3 }),
    offsetY: 0,
  }),
});

const FeatureManager = ({ map, featuresGeoJSON, onFeatureClick }) => {
  const [featureLayer, setFeatureLayer] = useState(null);

  useEffect(() => {
    if (!map) return;

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => feature.getGeometry().getType() === 'Point' ? MARKER_STYLE : FEATURE_STYLE,
      zIndex: 1000
    });

    map.addLayer(vectorLayer);
    setFeatureLayer(vectorLayer);

    const handleMapClick = (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
        return feature.get('featureId') ? feature : null;
      });

      if (feature && onFeatureClick) {
        // Find the original GeoJSON feature from the data
        const featureId = feature.get('featureId');
        const originalFeature = featuresGeoJSON.features.find(f => f.properties.id === featureId);
        if (originalFeature) {
          onFeatureClick(originalFeature);
        }
      }
    };

    map.on('singleclick', handleMapClick);

    return () => {
      map.removeLayer(vectorLayer);
      map.un('singleclick', handleMapClick);
    };
  }, [map, onFeatureClick, featuresGeoJSON]);

  useEffect(() => {
    if (!featureLayer || !featuresGeoJSON) return;

    const source = featureLayer.getSource();
    source.clear();

    if (featuresGeoJSON.features && featuresGeoJSON.features.length > 0) {
      const format = new GeoJSON();
      const features = format.readFeatures(featuresGeoJSON, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });

      // Add metadata to each feature for click handling
      features.forEach(feature => {
        const originalFeature = featuresGeoJSON.features.find(f => 
          f.properties.id === feature.get('id')
        );
        if (originalFeature) {
          feature.set('featureId', originalFeature.properties.id);
          feature.set('properties', originalFeature.properties);
          // Don't store the raw geometry object - OpenLayers will handle geometry internally

          // feature.getStyle().getText().text = originalFeature.properties.label;
        }
      });

      source.addFeatures(features);
    }
  }, [featureLayer, featuresGeoJSON]);

  return null;
};

export default FeatureManager;