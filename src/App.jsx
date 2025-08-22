import React, { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import MapComponent from './Map';
import LayerToggle from './LayerToggle';
import CoordinateDisplay from './CoordinateDisplay';
import SearchBar from './SearchBar';
import MarkerControls from './MarkerControls';
import MarkerForm from './MarkerForm';
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
  const [markers, setMarkers] = useState([]);
  const [showMarkerForm, setShowMarkerForm] = useState(false);
  const [editingMarker, setEditingMarker] = useState(null);
  const [addMarkerMode, setAddMarkerMode] = useState(false);

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
    if (addMarkerMode) {
      setShowMarkerForm(true);
    }
  };

  const handleClearCoordinates = () => {
    setCoordinates(null);
  };

  const handleMarkerClick = (marker) => {
    setEditingMarker(marker);
    setShowMarkerForm(true);
  };

  const handleAddMarkerClick = () => {
    setAddMarkerMode(true);
    setCoordinates(null);
  };

  const handleMarkerSave = (markerData) => {
    if (editingMarker) {
      setMarkers(prev => prev.map(m => m.id === markerData.id ? markerData : m));
    } else {
      setMarkers(prev => [...prev, markerData]);
    }
  };

  const handleMarkerDelete = (markerId) => {
    setMarkers(prev => prev.filter(m => m.id !== markerId));
  };

  const handleMarkerFormClose = () => {
    setShowMarkerForm(false);
    setEditingMarker(null);
    setAddMarkerMode(false);
  };

  const debouncedAddressSearch = debounce(async (query) => {
    const coords = await lookupAddress(query);
    setSearchCoordinates(coords);
  }, 4000, { leading: true });

  const handleAddressSearch = async (query) => {
    if (query.trim()) {
      debouncedAddressSearch(query);
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
        markers={markers}
        onMarkerClick={handleMarkerClick}
        addMarkerMode={addMarkerMode}
      />
      <LayerToggle
        layers={layers}
        setLayers={setLayers}
      />
      <CoordinateDisplay
        clickCoordinates={clickCoordinates}
        onClear={handleClearCoordinates}
      />
      <SearchBar onSearch={handleAddressSearch} />
      <MarkerControls
        markers={markers}
        onMarkersChange={setMarkers}
        onAddMarkerClick={handleAddMarkerClick}
      />
      <MarkerForm
        isOpen={showMarkerForm}
        onClose={handleMarkerFormClose}
        onSave={handleMarkerSave}
        onDelete={handleMarkerDelete}
        editingMarker={editingMarker}
        clickCoordinates={addMarkerMode ? clickCoordinates : null}
      />
    </div>
  );
}

export default App;
