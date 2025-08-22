import React, { useState } from 'react';
import { createGeoJSONFromMarkers, createMarkersFromGeoJSON } from './markerUtils';
import './MarkerControls.css';

const MarkerControls = ({ markers, onMarkersChange, onAddMarkerClick }) => {
  const [showControls, setShowControls] = useState(false);

  const handleSaveToFile = () => {
    const geojson = createGeoJSONFromMarkers(markers);
    const dataStr = JSON.stringify(geojson, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `coral-markers-${new Date().toISOString().split('T')[0]}.geojson`;
    
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
        const loadedMarkers = createMarkersFromGeoJSON(geojson);
        onMarkersChange(loadedMarkers);
      } catch (error) {
        alert('Error loading markers: ' + error.message);
      }
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be loaded again if needed
    event.target.value = '';
  };

  const handleClearAllMarkers = () => {
    if (markers.length === 0) return;
    
    if (window.confirm(`Are you sure you want to remove all ${markers.length} markers? This action cannot be undone.`)) {
      onMarkersChange([]);
    }
  };

  return (
    <div className="marker-controls">
      <button 
        className="marker-controls-toggle"
        onClick={() => setShowControls(!showControls)}
        title="Marker Controls"
      >
        🪸 ({markers.length})
      </button>
      
      {showControls && (
        <div className="marker-controls-panel">
          <div className="marker-controls-header">
            <h4>Coral Markers</h4>
            <span className="marker-count">{markers.length} markers</span>
          </div>
          
          <div className="marker-controls-actions">
            <button 
              className="btn btn-primary"
              onClick={onAddMarkerClick}
              title="Click on the map to add a marker at that location"
            >
              + Add Marker
            </button>
            
            <div className="file-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleSaveToFile}
                disabled={markers.length === 0}
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
              onClick={handleClearAllMarkers}
              disabled={markers.length === 0}
            >
              🗑️ Clear All
            </button>
          </div>
          
          {markers.length > 0 && (
            <div className="marker-summary">
              <div className="marker-type-counts">
                <div>🪸 Coral Tables: {markers.filter(m => m.type === 'coral_table').length}</div>
                <div>🐠 Natural: {markers.filter(m => m.type === 'natural_feature').length}</div>
                <div>📊 Monitoring: {markers.filter(m => m.type === 'monitoring_point').length}</div>
                <div>📍 Other: {markers.filter(m => m.type === 'other').length}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkerControls;