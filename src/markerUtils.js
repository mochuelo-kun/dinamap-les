export const MARKER_TYPES = {
  CORAL_TABLE: 'coral_table',
  NATURAL_FEATURE: 'natural_feature',
  MONITORING_POINT: 'monitoring_point',
  OTHER: 'other'
};

export const createGeoJSONFromMarkers = (markers) => {
  return {
    type: "FeatureCollection",
    features: markers.map(marker => ({
      type: "Feature",
      properties: {
        id: marker.id,
        type: marker.type,
        label: marker.label,
        notes: marker.notes,
        dateAdded: marker.dateAdded,
        dateRemoved: marker.dateRemoved,
        createdAt: marker.createdAt,
        updatedAt: marker.updatedAt
      },
      geometry: {
        type: "Point",
        coordinates: [marker.longitude, marker.latitude]
      }
    }))
  };
};

export const createMarkersFromGeoJSON = (geojson) => {
  if (!geojson || !geojson.features) return [];
  
  return geojson.features.map(feature => ({
    id: feature.properties.id,
    type: feature.properties.type || MARKER_TYPES.OTHER,
    label: feature.properties.label || '',
    notes: feature.properties.notes || '',
    dateAdded: feature.properties.dateAdded || null,
    dateRemoved: feature.properties.dateRemoved || null,
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
    createdAt: feature.properties.createdAt,
    updatedAt: feature.properties.updatedAt
  }));
};