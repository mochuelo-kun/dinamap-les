export const MARKER_TYPES = {
    CORAL_TABLE: 'coral_table',
    NATURAL_FEATURE: 'natural_feature',
    MONITORING_POINT: 'monitoring_point',
    OTHER: 'other',
}

export const createFeature = (formData) => {
    return {
        type: 'Feature',
        properties: {
            id: formData.id || Date.now().toString(),
            type: formData.type,
            label: formData.label || '',
            notes: formData.notes || '',
            dateAdded: formData.dateAdded || null,
            dateRemoved: formData.dateRemoved || null,
            createdAt: formData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        geometry: {
            type: 'Point',
            coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
        },
    }
}

export const createEmptyGeoJSON = () => {
    return {
        type: 'FeatureCollection',
        features: [],
    }
}

export const addFeatureToGeoJSON = (geojson, feature) => {
    return {
        ...geojson,
        features: [...geojson.features, feature],
    }
}

export const updateFeatureInGeoJSON = (geojson, featureId, updatedFeature) => {
    return {
        ...geojson,
        features: geojson.features.map((f) => (f.properties.id === featureId ? updatedFeature : f)),
    }
}

export const removeFeatureFromGeoJSON = (geojson, featureId) => {
    return {
        ...geojson,
        features: geojson.features.filter((f) => f.properties.id !== featureId),
    }
}
