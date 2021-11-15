/** @typedef {typeof __propDef.props}  ScatterPlotProps */
/** @typedef {typeof __propDef.events}  ScatterPlotEvents */
/** @typedef {typeof __propDef.slots}  ScatterPlotSlots */
export default class ScatterPlot extends SvelteComponentTyped<{
    title?: any;
    legend?: boolean;
    data?: any;
    x?: any;
    y?: any;
    series?: any;
    fillColor?: any;
    yMin?: any;
    subtitle?: any;
    xType?: any;
    xAxisTitle?: any;
    xGridlines?: any;
    yAxisTitle?: any;
    yGridlines?: any;
    outlineColor?: any;
    outlineWidth?: any;
    shape?: any;
    opacity?: any;
    pointSize?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type ScatterPlotProps = typeof __propDef.props;
export type ScatterPlotEvents = typeof __propDef.events;
export type ScatterPlotSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        title?: any;
        legend?: boolean;
        data?: any;
        x?: any;
        y?: any;
        series?: any;
        fillColor?: any;
        yMin?: any;
        subtitle?: any;
        xType?: any;
        xAxisTitle?: any;
        xGridlines?: any;
        yAxisTitle?: any;
        yGridlines?: any;
        outlineColor?: any;
        outlineWidth?: any;
        shape?: any;
        opacity?: any;
        pointSize?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
