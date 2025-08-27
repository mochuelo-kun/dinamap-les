import { Fill, Icon, Stroke, Style, Text } from 'ol/style'

export const FEATURE_STYLE = new Style({
    fill: new Fill({
        color: 'rgba(0, 0, 0, 0)', // No fill - transparent
    }),
    stroke: new Stroke({
        color: '#ffff00', // Yellow border
        width: 2,
    }),
})

export const POINT_FEATURE_STYLE = new Style({
    text: new Text({
        text: '⌖',
        font: 'bold 24px sans-serif',
        fill: new Fill({ color: '#ffff00' }),
        stroke: new Stroke({ color: '#000000', width: 3 }),
        offsetY: 0,
    }),
})

export const COORDINATE_MARKER_STYLE = new Style({
    text: new Text({
        text: '⌖',
        font: 'bold 28px sans-serif',
        fill: new Fill({ color: '#ffffff' }),
        stroke: new Stroke({ color: '#000000', width: 3 }),
        offsetY: 0,
    }),
})
