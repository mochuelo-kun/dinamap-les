import React, { useState, useEffect, useRef } from 'react';
import MapComponent from './Map';
import LayerToggle from './LayerToggle';
import CoordinateDisplay from './CoordinateDisplay';
import SearchBar from './SearchBar';
import './App.css';
import { getLatestLayerConfig } from './layerConfigService';
import {
  SEGARA_LESTARI_HOME_LONLAT_COORDS,
  SEGARA_LESTARI_HOME_ZOOM,
} from './mapConfig';

const lookupAddress = async (address) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  try {
    const response = await fetch(url, {
      method: 'GET',
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
};

function App() {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clickCoordinates, setCoordinates] = useState(null); // For click on map
  const [searchCoordinates, setSearchCoordinates] = useState(null); // For search input

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

  const handleSearch = async (query) => {
    if (query.trim()) {
      const coords = await lookupAddress(query);
      setSearchCoordinates(coords);
    }
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
        clickCoordinates={clickCoordinates}
        searchCoordinates={searchCoordinates}
      />
      <LayerToggle
        layers={layers}
        setLayers={setLayers}
      />
      <CoordinateDisplay
        clickCoordinates={clickCoordinates}
        onClear={handleClearCoordinates}
      />
      <SearchBar onSearch={handleSearch} />
    </div>
  );
}

export default App;
