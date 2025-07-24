import React, { useState, useEffect } from 'react';
import MapComponent from './Map';
import LayerToggle from './LayerToggle';
import './App.css';
import { getLatestLayerConfig } from './layerConfigService';
import {
  SEGARA_LESTARI_HOME_LONLAT_COORDS,
  SEGARA_LESTARI_HOME_ZOOM,
} from './mapConfig';

function App() {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <MapComponent
        homeLatLng={SEGARA_LESTARI_HOME_LONLAT_COORDS}
        homeZoom={SEGARA_LESTARI_HOME_ZOOM}
        layers={layers}
      />
      <LayerToggle
        layers={layers}
        setLayers={setLayers}
      />
    </div>
  );
}

export default App;
