import React, { useState } from 'react';
import './LayerToggle.css';

const LayerToggle = ({ layers, setLayers }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleVisibilityToggle = (targetLayerIndex) => {
    setLayers(layers.map((layer, i) => 
        i === targetLayerIndex
          ? { ...layer, ["visible"]: !layer["visible"] }
          : layer
    ));
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
            layers.map(({ id, label, visible }, index) => {
              return (
                <div
                  key={`layer-label-${id}`}
                  onClick={() => handleVisibilityToggle(index)}
                >
                  <input
                    type="checkbox"
                    checked={visible}
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
