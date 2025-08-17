import React, { useState, useEffect, useRef } from 'react';
import MapComponent from './Map';
import LayerToggle from './LayerToggle';
import CoordinateDisplay from './CoordinateDisplay';
import './App.css';
import { getLatestLayerConfig } from './layerConfigService';
import {
  SEGARA_LESTARI_HOME_LONLAT_COORDS,
  SEGARA_LESTARI_HOME_ZOOM,
} from './mapConfig';

function App() {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getLatestLayerConfig();
        setLayers(config.layers);
      } catch (error) {
        console.error("Error fetching layer configuration:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleCoordinateClick = (coords) => {
    setCoordinates(coords);
  };

  const handleClearCoordinates = () => {
    setCoordinates(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <MapComponent
        homeLatLng={SEGARA_LESTARI_HOME_LONLAT_COORDS}
        homeZoom={SEGARA_LESTARI_HOME_ZOOM}
        layers={layers}
        onCoordinateClick={handleCoordinateClick}
        coordinates={coordinates}
      />
      <LayerToggle
        layers={layers}
        setLayers={setLayers}
      />
      <CoordinateDisplay
        coordinates={coordinates}
        onClear={handleClearCoordinates}
      />
    </div>
  );
}

export default App;
