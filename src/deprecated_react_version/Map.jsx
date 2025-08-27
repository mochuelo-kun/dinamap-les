import React, { useRef, useEffect, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import WebGLTileLayer from 'ol/layer/WebGLTile'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import GeoTIFF from 'ol/source/GeoTIFF'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { fromLonLat, toLonLat } from 'ol/proj'
import { ScaleLine, defaults as defaultControls } from 'ol/control'
import 'ol/ol.css'

import './Map.css'
import { LAYER_TYPE_OSM, LAYER_TYPE_SATELLITE, LAYER_TYPE_GEOTIFF } from './mapConfig'
import { COORDINATE_MARKER_STYLE, FEATURE_STYLE, POINT_FEATURE_STYLE } from './featureStyles'

const usePrevious = (value, initialValue) => {
    const ref = useRef(initialValue)
    useEffect(() => {
        ref.current = value
    })
    return ref.current
}

const useEffectDebugger = (effectHook, dependencies, dependencyNames = [], useEffectLabel) => {
    const previousDeps = usePrevious(dependencies, [])

    const changedDeps = dependencies.reduce((accum, dependency, index) => {
        if (dependency !== previousDeps[index]) {
            const keyName = dependencyNames[index] || index
            return {
                ...accum,
                [keyName]: {
                    before: previousDeps[index],
                    after: dependency,
                },
            }
        }

        return accum
    }, {})

    if (Object.keys(changedDeps).length) {
        console.log(`${useEffectLabel} [use-effect-debugger] `, changedDeps)
    }

    useEffect(effectHook, dependencies)
}

const MapComponent = ({
    homeLatLng,
    homeZoom,
    layers,
    onCoordinateClick,
    clickCoordinates,
    searchCoordinates,
    featuresGeoJSON,
    onFeatureClick,
    addFeatureMode,
}) => {
    const mapRef = useRef()
    const [map, setMap] = useState(null)
    const [coordinateMarkerLayer, setCoordinateMarkerLayer] = useState(null)

    // useEffect(() => {
    useEffectDebugger(
        () => {
            // on initial load/mount (should only fire once)
            console.log('useEffect for INITIAL MAP MOUNT firing')

            const layerComponents = layers.map((layer) => {
                const { url, type, visible, attributionText, attributionUrl, maxZoom } = layer
                if (type === LAYER_TYPE_OSM) {
                    return new TileLayer({
                        source: new OSM(),
                        visible: visible,
                    })
                } else if (type === LAYER_TYPE_SATELLITE) {
                    return new TileLayer({
                        source: new XYZ({
                            url: url,
                            attributions: `Tiles © <a href=${attributionUrl}>${attributionText}</a>`,
                            maxZoom: maxZoom,
                        }),
                        visible: visible,
                    })
                } else if (type === LAYER_TYPE_GEOTIFF) {
                    return new WebGLTileLayer({
                        visible: visible,
                        source: new GeoTIFF({
                            sources: [{ url: url }],
                            attributions: `Tiles © <a href=${attributionUrl}>${attributionText}</a>`,
                        }),
                    })
                } else {
                    throw new Error(`Unknown layer config type: ${type}`)
                }
            })

            const coordinateMarkerSource = new VectorSource()
            const coordinateMarkerLayerInstance = new VectorLayer({
                source: coordinateMarkerSource,
                style: COORDINATE_MARKER_STYLE,
            })

            const olMap = new Map({
                target: mapRef.current,
                layers: [...layerComponents, coordinateMarkerLayerInstance],
                view: new View({
                    center: fromLonLat(homeLatLng),
                    zoom: homeZoom,
                    // allow user to zoom as deep as they want into geotiffs
                    maxZoom: undefined,
                }),
                controls: defaultControls().extend([
                    new ScaleLine({
                        units: 'metric',
                        bar: true,
                        steps: 6,
                        // text: true,
                        minWidth: 180,
                    }),
                ]),
            })

            console.log(olMap.getLayers())

            setMap(olMap)
            setCoordinateMarkerLayer(coordinateMarkerLayerInstance)

            return () => olMap.setTarget(undefined)
            // }, [homeLatLng, homeZoom, layers]);
        },
        [homeLatLng, homeZoom, layers],
        ['homeLatLng', 'homeZoom', 'layers'],
        'INITIAL MAP MOUNT'
    )

    // useEffect(() => {
    useEffectDebugger(
        () => {
            // should fire to handle layer visibility changes
            console.log('useEffect for LAYER VISIBILITY CHANGE')
            if (!map) return
            layers.forEach(({ visible }, i) => {
                map.getLayers().getArray()[i].setVisible(visible)
            })
            // }, [layers, map]);
        },
        [layers, map],
        ['layers', 'map'],
        'LAYER VISIBILITY CHANGE'
    )

    // useEffect(() => {
    useEffectDebugger(
        () => {
            // TODO: (temp non-feature coords -> include feature clicks too?)
            // should fire to handle map clicks
            console.log('useEffect for COORDINATE CLICK')
            if (!map || !coordinateMarkerLayer) return

            const coordinateMarkerLayerSource = coordinateMarkerLayer.getSource()
            coordinateMarkerLayerSource.clear()

            if (clickCoordinates) {
                const coordinateMarker = new Feature({
                    geometry: new Point(fromLonLat([clickCoordinates.lng, clickCoordinates.lat])),
                })
                coordinateMarkerLayerSource.addFeature(coordinateMarker)
            }
            // }, [clickCoordinates, map, coordinateMarkerLayer]);
        },
        [clickCoordinates, map, coordinateMarkerLayer],
        ['clickCoordinates', 'map', 'coordinateMarkerLayer'],
        'ORIGINAL COORDINATE CLICK'
    )

    // useEffect(() => {
    useEffectDebugger(
        () => {
            // TODO: merge with other coordinate click?
            // should fire to FEATURE map clicks?
            console.log('useEffect for FEATURE CLICK')
            if (!map) return

            const handleMapClick = (event) => {
                // Check if clicking on an existing feature
                const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
                    return feature.get('featureId') ? feature : null
                })

                if (feature && onFeatureClick && !addFeatureMode) {
                    // Find the original GeoJSON feature from the data
                    const featureId = feature.get('featureId')
                    const originalFeature = featuresGeoJSON.features.find((f) => f.properties.id === featureId)
                    if (originalFeature) {
                        onFeatureClick(originalFeature)
                    }
                    return
                }

                // Handle coordinate click (for coordinate display or adding features)
                const coordinate = toLonLat(event.coordinate)
                const [lng, lat] = coordinate

                if (onCoordinateClick) {
                    onCoordinateClick({ lat, lng })
                }
            }

            map.on('singleclick', handleMapClick)

            return () => {
                map.un('singleclick', handleMapClick)
            }
            // }, [map, onCoordinateClick, onFeatureClick, addFeatureMode, featuresGeoJSON]);
        },
        [map, onCoordinateClick, onFeatureClick, addFeatureMode, featuresGeoJSON],
        ['map', 'onCoordinateClick', 'onFeatureClick', 'addFeatureMode', 'featuresGeoJSON'],
        'FEATURE CLICK'
    )

    // useEffect(() => {
    useEffectDebugger(
        () => {
            // should fire to handle changes in search coordinates
            console.log('useEffect for SEARCH / FLY TO')
            if (!map) return

            if (searchCoordinates) {
                const duration = 8000
                map.getView().animate(
                    {
                        zoom: 7,
                        duration: duration / 4,
                    },
                    {
                        center: fromLonLat([searchCoordinates.lng, searchCoordinates.lat]),
                        duration: duration / 2,
                    },
                    {
                        zoom: 13,
                        duration: duration / 4,
                    }
                )
            }
            // }, [searchCoordinates, map]);
        },
        [searchCoordinates, map],
        ['searchCoordinates', 'map'],
        'SEARCH / FLY TO'
    )

    /// NAIVE DUMP FeatureManager
    const [featureLayer, setFeatureLayer] = useState(null)

    // useEffect(() => {
    useEffectDebugger(
        () => {
            // should fire to handle feature manager clicks
            console.log('useEffect for FEATURE MANAGER MAP CLICKS')
            if (!map) return

            const vectorSource = new VectorSource()
            const vectorLayer = new VectorLayer({
                source: vectorSource,
                style: (feature) => (feature.getGeometry().getType() === 'Point' ? POINT_FEATURE_STYLE : FEATURE_STYLE),
                zIndex: 1000,
            })

            map.addLayer(vectorLayer)
            setFeatureLayer(vectorLayer)

            const handleMapClick = (event) => {
                const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
                    return feature.get('featureId') ? feature : null
                })

                if (feature && onFeatureClick) {
                    // Find the original GeoJSON feature from the data
                    const featureId = feature.get('featureId')
                    const originalFeature = featuresGeoJSON.features.find((f) => f.properties.id === featureId)
                    if (originalFeature) {
                        onFeatureClick(originalFeature)
                    }
                }
            }

            map.on('singleclick', handleMapClick)

            return () => {
                map.removeLayer(vectorLayer)
                map.un('singleclick', handleMapClick)
            }
            // }, [map, onFeatureClick, featuresGeoJSON]);
        },
        [map, onFeatureClick, featuresGeoJSON],
        ['map', 'onFeatureClick', 'featuresGeoJSON'],
        'FEATURE MANAGER MAP CLICKS'
    )

    // useEffect(() => {
    useEffectDebugger(
        () => {
            // should fire to handle changes in features geojson
            console.log('useEffect for GEOJSON CHANGES')
            if (!featureLayer || !featuresGeoJSON) return

            const source = featureLayer.getSource()
            source.clear()

            if (featuresGeoJSON.features && featuresGeoJSON.features.length > 0) {
                const format = new GeoJSON()
                const features = format.readFeatures(featuresGeoJSON, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857',
                })

                // Add metadata to each feature for click handling
                features.forEach((feature) => {
                    const originalFeature = featuresGeoJSON.features.find((f) => f.properties.id === feature.get('id'))
                    if (originalFeature) {
                        feature.set('featureId', originalFeature.properties.id)
                        feature.set('properties', originalFeature.properties)
                        // Don't store the raw geometry object - OpenLayers will handle geometry internally
                    }
                })

                source.addFeatures(features)
            }
            // }, [featureLayer, featuresGeoJSON]);
        },
        [featureLayer, featuresGeoJSON],
        ['featureLayer', 'featuresGeoJSON'],
        'GEOJSON CHANGES'
    )

    return (
        <>
            <div
                style={{
                    height: '100vh',
                    width: '100%',
                    cursor: addFeatureMode ? 'crosshair' : 'default',
                }}
                ref={mapRef}
            />
        </>
    )
}

export default MapComponent
