import React, { useState, useEffect } from 'react';
import { MARKER_TYPES } from './markerUtils';
import './MarkerForm.css';

const MarkerForm = ({ isOpen, onClose, onSave, onDelete, editingMarker, clickCoordinates }) => {
  const [formData, setFormData] = useState({
    type: MARKER_TYPES.CORAL_TABLE,
    label: '',
    notes: '',
    dateAdded: '',
    dateRemoved: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    if (editingMarker) {
      setFormData({
        type: editingMarker.type,
        label: editingMarker.label || '',
        notes: editingMarker.notes || '',
        dateAdded: editingMarker.dateAdded || '',
        dateRemoved: editingMarker.dateRemoved || '',
        latitude: editingMarker.latitude.toFixed(6),
        longitude: editingMarker.longitude.toFixed(6)
      });
    } else if (clickCoordinates) {
      setFormData(prev => ({
        ...prev,
        latitude: clickCoordinates.lat.toFixed(6),
        longitude: clickCoordinates.lng.toFixed(6)
      }));
    }
  }, [editingMarker, clickCoordinates]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const markerData = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      id: editingMarker?.id || Date.now().toString(),
      createdAt: editingMarker?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (formData.dateAdded) {
      markerData.dateAdded = formData.dateAdded;
    }
    if (formData.dateRemoved) {
      markerData.dateRemoved = formData.dateRemoved;
    }

    onSave(markerData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      type: MARKER_TYPES.CORAL_TABLE,
      label: '',
      notes: '',
      dateAdded: '',
      dateRemoved: '',
      latitude: '',
      longitude: ''
    });
    onClose();
  };

  const handleDelete = () => {
    if (!editingMarker) return;
    
    if (window.confirm('Are you sure you want to delete this marker? This action cannot be undone.')) {
      onDelete(editingMarker.id);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="marker-form-overlay">
      <div className="marker-form-container">
        <div className="marker-form-header">
          <h3>{editingMarker ? 'Edit Marker' : 'Add New Marker'}</h3>
          <button 
            type="button" 
            className="marker-form-close"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="marker-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type:</label>
              <select 
                id="type"
                name="type" 
                value={formData.type} 
                onChange={handleInputChange}
                required
              >
                <option value={MARKER_TYPES.CORAL_TABLE}>Coral Table</option>
                <option value={MARKER_TYPES.NATURAL_FEATURE}>Natural Feature</option>
                <option value={MARKER_TYPES.MONITORING_POINT}>Monitoring Point</option>
                <option value={MARKER_TYPES.OTHER}>Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="label">Label:</label>
              <input
                type="text"
                id="label"
                name="label"
                value={formData.label}
                onChange={handleInputChange}
                placeholder="Brief label for the marker"
                maxLength={50}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="notes">Notes:</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Detailed notes about this location..."
                rows={4}
              />
            </div>
          </div>

          {(formData.type === MARKER_TYPES.CORAL_TABLE) && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateAdded">Date Added:</label>
                <input
                  type="date"
                  id="dateAdded"
                  name="dateAdded"
                  value={formData.dateAdded}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="dateRemoved">Date Removed (if applicable):</label>
                <input
                  type="date"
                  id="dateRemoved"
                  name="dateRemoved"
                  value={formData.dateRemoved}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude">Latitude:</label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="0.000001"
                min="-90"
                max="90"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="longitude">Longitude:</label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="0.000001"
                min="-180"
                max="180"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            {editingMarker && (
              <button type="button" onClick={handleDelete} className="btn-delete">
                Delete
              </button>
            )}
            <div className="form-actions-right">
              <button type="button" onClick={handleClose} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" className="btn-save">
                {editingMarker ? 'Update Marker' : 'Add Marker'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarkerForm;