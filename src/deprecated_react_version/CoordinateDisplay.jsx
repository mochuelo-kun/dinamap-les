import React from 'react';
import './CoordinateDisplay.css';

const CoordinateDisplay = ({ clickCoordinates, onClear }) => {
  if (!clickCoordinates) {
    return null;
  }

  const { lat, lng } = clickCoordinates;

  return (
    <div className="coordinate-display">
      <div className="coordinate-content">
        <div className="coordinate-text">
          <div>Lat: {lat.toFixed(6)}</div>
          <div>Lng: {lng.toFixed(6)}</div>
        </div>
        <button 
          className="coordinate-close" 
          onClick={onClear}
          aria-label="Clear click coordinates"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default CoordinateDisplay;