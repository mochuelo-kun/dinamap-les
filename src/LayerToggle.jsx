import React from 'react';
import './LayerToggle.css';
// import { getSortedLayerConfigs } from './mapConfig';

const LayerToggle = ({ layerConfigs, layerVisibility, setLayerVisibility }) => {
  const handleToggle = (layerId) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  return (
    <div className="layer-toggle">
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
  );
};

export default LayerToggle;
