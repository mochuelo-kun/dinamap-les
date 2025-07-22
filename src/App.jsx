import React, { useState } from 'react';
import MapComponent from './Map';
import LayerToggle from './LayerToggle';
import './App.css';
import {
  getSortedLayerConfigs,
  SEGARA_LESTARI_HOME_LONLAT_COORDS,
  SEGARA_LESTARI_HOME_ZOOM,
} from './mapConfig';

function App() {
  const [layers, setLayers] = useState(getSortedLayerConfigs());

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
