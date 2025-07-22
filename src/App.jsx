import React, { useState } from 'react';
import MapComponent from './Map';
import LayerToggle from './LayerToggle';
import './App.css';
import {
  getdefaultLayerVisibilitys,
  getSortedLayerConfigs,
  SEGARA_LESTARI_HOME_LONLAT_COORDS,
  SEGARA_LESTARI_HOME_ZOOM,
} from './mapConfig';

function App() {
  const layerConfigs = getSortedLayerConfigs();
  const [layerVisibility, setLayerVisibility] = useState(getdefaultLayerVisibilitys());

  return (
    <div className="App">
      <MapComponent
        homeLatLng={SEGARA_LESTARI_HOME_LONLAT_COORDS}
        homeZoom={SEGARA_LESTARI_HOME_ZOOM}
        layerConfigs={layerConfigs}
        layerVisibility={layerVisibility}
      />
      <LayerToggle
        layerConfigs={layerConfigs}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
      />
    </div>
  );
}

export default App;
