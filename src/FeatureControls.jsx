import React, { useState } from 'react';
import { createEmptyGeoJSON } from './featureUtils';
import './FeatureControls.css';

const FeatureControls = ({ featuresGeoJSON, onFeaturesChange, onAddFeatureClick }) => {
  const [showControls, setShowControls] = useState(false);

  const handleSaveToFile = () => {
    const dataStr = JSON.stringify(featuresGeoJSON, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `features-${new Date().toISOString().split('T')[0]}.geojson`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleLoadFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const geojson = JSON.parse(e.target.result);
        if (geojson.type === 'FeatureCollection') {
          onFeaturesChange(geojson);
        } else {
          alert('Error: File must be a valid GeoJSON FeatureCollection');
        }
      } catch (error) {
        alert('Error loading features: ' + error.message);
      }
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be loaded again if needed
    event.target.value = '';
  };

  const handleClearAllFeatures = () => {
    if (featuresGeoJSON.features.length === 0) return;
    
    if (window.confirm(`Are you sure you want to remove all ${featuresGeoJSON.features.length} features? This action cannot be undone.`)) {
      onFeaturesChange(createEmptyGeoJSON());
    }
  };

  return (
    <div className="feature-controls">
      <button 
        className="feature-controls-toggle"
        onClick={() => setShowControls(!showControls)}
        title="Feature Controls"
      >
        🗺️ ({featuresGeoJSON.features.length})
      </button>
      
      {showControls && (
        <div className="feature-controls-panel">
          <div className="feature-controls-header">
            <h4>Map Features</h4>
            <span className="feature-count">{featuresGeoJSON.features.length} features</span>
          </div>
          
          <div className="feature-controls-actions">
            <button 
              className="btn btn-primary"
              onClick={onAddFeatureClick}
              title="Click on the map to add a feature at that location"
            >
              + Add Feature
            </button>
            
            <div className="file-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleSaveToFile}
                disabled={featuresGeoJSON.features.length === 0}
              >
                💾 Save GeoJSON
              </button>
              
              <label className="btn btn-secondary file-input-label">
                📁 Load GeoJSON
                <input 
                  type="file" 
                  accept=".geojson,.json" 
                  onChange={handleLoadFromFile}
                  className="file-input"
                />
              </label>
            </div>
            
            <button 
              className="btn btn-danger"
              onClick={handleClearAllFeatures}
              disabled={featuresGeoJSON.features.length === 0}
            >
              🗑️ Clear All
            </button>
          </div>
          
          {featuresGeoJSON.features.length > 0 && (
            <div className="feature-summary">
              <div className="feature-type-counts">
                <div>🪸 Coral Tables: {featuresGeoJSON.features.filter(f => f.properties.type === 'coral_table').length}</div>
                <div>🐠 Natural: {featuresGeoJSON.features.filter(f => f.properties.type === 'natural_feature').length}</div>
                <div>📊 Monitoring: {featuresGeoJSON.features.filter(f => f.properties.type === 'monitoring_point').length}</div>
                <div>📍 Other: {featuresGeoJSON.features.filter(f => f.properties.type === 'other').length}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeatureControls;