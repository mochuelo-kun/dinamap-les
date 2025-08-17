import React from 'react';
import './CoordinateDisplay.css';

const CoordinateDisplay = ({ coordinates, onClear }) => {
  if (!coordinates) {
    return null;
  }

  const { lat, lng } = coordinates;

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
          aria-label="Clear coordinates"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default CoordinateDisplay;