export const SEGARA_LESTARI_HOME_LONLAT_COORDS = [115.367526, -8.129998];
export const SEGARA_LESTARI_HOME_ZOOM = 18;

export const LAYER_TYPE_OSM = 'osm';
export const LAYER_TYPE_SATELLITE = 'satellite';
export const LAYER_TYPE_GEOTIFF = 'geotiff';

const layerConfigs = [
    {
        id: 'osm',
        type: LAYER_TYPE_OSM,
        label: 'OpenStreetMap',
        layerOrder: 0,
        layerVisibilityDefault: true,
        metadata: {},
    },
    {
        id: 'satellite',
        type: LAYER_TYPE_SATELLITE,
        label: 'Satellite',
        layerOrder: 1,
        layerVisibilityDefault: false,
        metadata: {
            tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attributionUrl: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
            attributionName: 'ArcGIS - World Imagery',
            maxZoom: 18,
        },
    },
    {
        id: 'geotiff1',
        type: LAYER_TYPE_GEOTIFF,
        label: 'Dinacon 2025 - Ben/Andy - Drone Scan Land (higher)',
        layerOrder: 2,
        layerVisibilityDefault: true,
        metadata: {
            url: 'https://dinamap-les.s3.amazonaws.com/geotiff/Segara-Lestari-Drone-Scan-higher-altitude-2025-07-16-orthophoto.raw.cog.tif',
            contributedOn: '2025-07-16',
            contributedBy: 'Ben / Andy',
        }
    },
    {
        id: 'geotiff2',
        type: LAYER_TYPE_GEOTIFF,
        label: 'Dinacon 2025 - Ben/Andy - Drone Scan Land (lower)',
        layerOrder: 3,
        layerVisibilityDefault: true,
        metadata: {
            url: 'https://dinamap-les.s3.amazonaws.com/geotiff/Segara-Lestari-Drone-Scan-lower-altitude-2025-07-16-orthophoto.raw.cog.tif',
            contributedOn: '2025-07-16',
            contributedBy: 'Ben / Andy',
        }
    },
    {
        id: 'geotiff3',
        type: LAYER_TYPE_GEOTIFF,
        label: 'Dinacon 2025 - Logan - Rough Drone Sea Scan 1',
        layerOrder: 4,
        layerVisibilityDefault: true,
        metadata: {
            url: 'https://dinamap-les.s3.amazonaws.com/geotiff/2025-07-dinacon-drone-sea-1.cog.tif',
            contributedOn: '2025-07-09',
            contributedBy: 'Logan',
        }
    },
    {
        id: 'geotiff4',
        type: LAYER_TYPE_GEOTIFF,
        label: 'Dinacon 2025 - Logan - Rough Drone Sea Scan 2',
        layerOrder: 5,
        layerVisibilityDefault: true,
        metadata: {
            url: 'https://dinamap-les.s3.amazonaws.com/geotiff/2025-07-dinacon-drone-sea-2.cog.tif',
            contributedOn: '2025-07-09',
            contributedBy: 'Logan',
        }
    },
    {
        id: 'geotiff5',
        type: LAYER_TYPE_GEOTIFF,
        label: 'Dinacon 2025 - Alison - Coral Tables Segara Lestari',
        layerOrder: 6,
        layerVisibilityDefault: true,
        metadata: {
            url: 'https://dinamap-les.s3.amazonaws.com/geotiff/2025-07-dinacon-alison-coral-tables.cog.tif',
            contributedOn: '2025-07-09',
            contributedBy: 'Alison',
        }
    },
];

const layerConfigsSorted = layerConfigs.toSorted((a, b) => {
    if (a.layerOrder === b.layerOrder) {
        throw `Layer config error: layers ${a.id} and ${b.id} cannot have the same layerOrder`;
    }
    return a.layerOrder - b.layerOrder;
});
export const getSortedLayerConfigs = () => layerConfigsSorted;

const layerVisibilityDefaults = {};
layerConfigs.forEach(lc => layerVisibilityDefaults[lc.id] = lc.layerVisibilityDefault);
export const getLayerVisibilityDefaults = () => layerVisibilityDefaults;