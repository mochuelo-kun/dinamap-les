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
import { createEmptyGeoJSON, addFeatureToGeoJSON, updateFeatureInGeoJSON, removeFeatureFromGeoJSON } from './markerUtils';

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
  const [featuresGeoJSON, setFeaturesGeoJSON] = useState(createEmptyGeoJSON());
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

  const handleFeatureClick = (feature) => {
    setEditingMarker(feature);
    setShowMarkerForm(true);
  };

  const handleAddMarkerClick = () => {
    setAddMarkerMode(true);
    setCoordinates(null);
  };

  const handleFeatureSave = (feature) => {
    if (editingMarker) {
      setFeaturesGeoJSON(prev => updateFeatureInGeoJSON(prev, feature.properties.id, feature));
    } else {
      setFeaturesGeoJSON(prev => addFeatureToGeoJSON(prev, feature));
    }
  };

  const handleFeatureDelete = (featureId) => {
    setFeaturesGeoJSON(prev => removeFeatureFromGeoJSON(prev, featureId));
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
        featuresGeoJSON={featuresGeoJSON}
        onFeatureClick={handleFeatureClick}
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
        featuresGeoJSON={featuresGeoJSON}
        onFeaturesChange={setFeaturesGeoJSON}
        onAddMarkerClick={handleAddMarkerClick}
      />
      <MarkerForm
        isOpen={showMarkerForm}
        onClose={handleMarkerFormClose}
        onSave={handleFeatureSave}
        onDelete={handleFeatureDelete}
        editingFeature={editingMarker}
        clickCoordinates={addMarkerMode ? clickCoordinates : null}
      />
    </div>
  );
}

export default App;
