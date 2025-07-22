import React, { useState } from 'react';
import './LayerToggle.css';

const LayerToggle = ({ layerConfigs, layerVisibility, setLayerVisibility }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (layerId) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  return (
    <div className="layer-toggle">
      <div className="layer-toggle-header" onClick={() => setIsOpen(!isOpen)}>
        <span>Layers</span>
        <span className={`caret ${isOpen ? 'open' : ''}`}>&#9660;</span>
      </div>
      {isOpen && (
        <div className="layer-toggle-content">
          {
            layerConfigs.map(({ id, label }) => {
              return (
                <div
                  key={`layer-label-${id}`}
                  onClick={() => handleToggle(id)}
                >
                  <input
                    type="checkbox"
                    checked={layerVisibility[id]}
                    readOnly
                  />
                  <label>{label}</label>
                </div>
              )
          })}
        </div>
      )}
    </div>
  );
};

export default LayerToggle;
