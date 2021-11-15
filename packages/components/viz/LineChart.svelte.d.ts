/** @typedef {typeof __propDef.props}  LineChartProps */
/** @typedef {typeof __propDef.events}  LineChartEvents */
/** @typedef {typeof __propDef.slots}  LineChartSlots */
export default class LineChart extends SvelteComponentTyped<{
    title?: any;
    legend?: boolean;
    data?: any;
    x?: any;
    y?: any;
    series?: any;
    yMin?: any;
    subtitle?: any;
    xType?: any;
    xAxisTitle?: any;
    xGridlines?: any;
    yAxisTitle?: any;
    yGridlines?: any;
    lineColor?: any;
    lineWidth?: any;
    lineType?: any;
    lineOpacity?: any;
    markers?: any;
    markerShape?: any;
    markerSize?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type LineChartProps = typeof __propDef.props;
export type LineChartEvents = typeof __propDef.events;
export type LineChartSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        title?: any;
        legend?: boolean;
        data?: any;
        x?: any;
        y?: any;
        series?: any;
        yMin?: any;
        subtitle?: any;
        xType?: any;
        xAxisTitle?: any;
        xGridlines?: any;
        yAxisTitle?: any;
        yGridlines?: any;
        lineColor?: any;
        lineWidth?: any;
        lineType?: any;
        lineOpacity?: any;
        markers?: any;
        markerShape?: any;
        markerSize?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
