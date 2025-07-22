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
        defaultLayerVisibility: true,
    },
    {
        id: 'satellite',
        type: LAYER_TYPE_SATELLITE,
        label: 'Satellite',
        defaultLayerVisibility: false,
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributionUrl: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
        attributionText: 'ArcGIS - World Imagery',
        maxZoom: 18,
    },
    {
        id: 'geotiff1',
        type: LAYER_TYPE_GEOTIFF,
        label: 'Dinacon 2025 - Ben/Andy - Drone Scan Land (higher)',
        defaultLayerVisibility: true,
        url: 'https://dinamap-les.s3.amazonaws.com/geotiff/Segara-Lestari-Drone-Scan-higher-altitude-2025-07-16-orthophoto.raw.cog.tif',
        attributionText: 'Dinacon 2025-07-16',
        date: '2025-07-16',
    },
    {
        id: 'geotiff2',
        type: LAYER_TYPE_GEOTIFF,
        label: 'Dinacon 2025 - Ben/Andy - Drone Scan Land (lower)',
        defaultLayerVisibility: true,
        url: 'https://dinamap-les.s3.amazonaws.com/geotiff/Segara-Lestari-Drone-Scan-lower-altitude-2025-07-16-orthophoto.raw.cog.tif',
        attributionText: 'Dinacon 2025-07-16',
        date: '2025-07-16',
    },
    {
        id: 'geotiff3',
        type: LAYER_TYPE_GEOTIFF,
        label: 'Dinacon 2025 - Logan - Rough Drone Sea Scan 1',
        defaultLayerVisibility: true,
        url: 'https://dinamap-les.s3.amazonaws.com/geotiff/2025-07-dinacon-drone-sea-1.cog.tif',
        attributionText: 'Dinacon 2025-07-09',
        date: '2025-07-09',
    },
    {
        id: 'geotiff4',
        type: LAYER_TYPE_GEOTIFF,
        label: 'Dinacon 2025 - Logan - Rough Drone Sea Scan 2',
        defaultLayerVisibility: true,
        url: 'https://dinamap-les.s3.amazonaws.com/geotiff/2025-07-dinacon-drone-sea-2.cog.tif',
        attributionText: 'Dinacon 2025-07-09',
        date: '2025-07-09',
    },
    {
        id: 'geotiff5',
        type: LAYER_TYPE_GEOTIFF,
        label: 'Dinacon 2025 - Alison - Coral Tables Segara Lestari',
        defaultLayerVisibility: true,
        url: 'https://dinamap-les.s3.amazonaws.com/geotiff/2025-07-dinacon-alison-coral-tables.cog.tif',
        attributionText: 'Dinacon 2025-07-09 - AOM',
        date: '2025-07-09',
    },
];
export const getSortedLayerConfigs = () => layerConfigs

const defaultLayerVisibilitys = {};
layerConfigs.forEach(lc => defaultLayerVisibilitys[lc.id] = lc.defaultLayerVisibility);
export const getdefaultLayerVisibilitys = () => defaultLayerVisibilitys;