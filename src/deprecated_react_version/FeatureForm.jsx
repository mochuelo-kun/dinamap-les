import React, { useState, useEffect } from 'react'
import { MARKER_TYPES, createFeature } from './featureUtils'
import './FeatureForm.css'

const FeatureForm = ({ isOpen, onClose, onSave, onDelete, editingFeature, clickCoordinates }) => {
    const [formData, setFormData] = useState({
        type: MARKER_TYPES.CORAL_TABLE,
        label: '',
        notes: '',
        dateAdded: '',
        dateRemoved: '',
        latitude: '',
        longitude: '',
    })

    useEffect(() => {
        if (editingFeature) {
            console.log('editingFeature')
            console.log(editingFeature)
            const props = editingFeature.properties
            const coords = editingFeature.geometry.coordinates
            console.log('coords')
            console.log(coords)
            setFormData({
                id: props.id,
                type: props.type,
                label: props.label || '',
                notes: props.notes || '',
                dateAdded: props.dateAdded || '',
                dateRemoved: props.dateRemoved || '',
                latitude: editingFeature.geometry.type == 'Point' ? coords[1].toFixed(6) : '',
                longitude: editingFeature.geometry.type == 'Point' ? coords[0].toFixed(6) : '',
                createdAt: props.createdAt,
                updatedAt: props.updatedAt,
            })
        } else if (clickCoordinates) {
            setFormData((prev) => ({
                ...prev,
                latitude: clickCoordinates.lat.toFixed(6),
                longitude: clickCoordinates.lng.toFixed(6),
            }))
        }
    }, [editingFeature, clickCoordinates])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        const feature = createFeature({
            ...formData,
            id: editingFeature?.properties.id || Date.now().toString(),
            createdAt: editingFeature?.properties.createdAt || new Date().toISOString(),
        })

        onSave(feature)
        handleClose()
    }

    const handleClose = () => {
        setFormData({
            type: MARKER_TYPES.CORAL_TABLE,
            label: '',
            notes: '',
            dateAdded: '',
            dateRemoved: '',
            latitude: '',
            longitude: '',
        })
        onClose()
    }

    const handleDelete = () => {
        if (!editingFeature) return

        if (window.confirm('Are you sure you want to delete this feature? This action cannot be undone.')) {
            onDelete(editingFeature.properties.id)
            handleClose()
        }
    }

    if (!isOpen) return null

    return (
        <div className="feature-form-overlay">
            <div className="feature-form-container">
                <div className="feature-form-header">
                    <h3>{editingFeature ? 'Edit Feature' : 'Add New Feature'}</h3>
                    <button type="button" className="feature-form-close" onClick={handleClose}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="feature-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="type">Type:</label>
                            <select id="type" name="type" value={formData.type} onChange={handleInputChange} required>
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
                                placeholder="Brief label for the feature"
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

                    {formData.type === MARKER_TYPES.CORAL_TABLE && (
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
                        {editingFeature && (
                            <button type="button" onClick={handleDelete} className="btn-delete">
                                Delete
                            </button>
                        )}
                        <div className="form-actions-right">
                            <button type="button" onClick={handleClose} className="btn-cancel">
                                Cancel
                            </button>
                            <button type="submit" className="btn-save">
                                {editingFeature ? 'Update Feature' : 'Add Feature'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default FeatureForm
