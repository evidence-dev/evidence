/** @typedef {typeof __propDef.props}  ScatterPlotProps */
/** @typedef {typeof __propDef.events}  ScatterPlotEvents */
/** @typedef {typeof __propDef.slots}  ScatterPlotSlots */
export default class ScatterPlot extends SvelteComponentTyped<{
    data: any;
    x?: any;
    y?: any;
    legend?: string;
    fillColor?: any;
    fillTransparency?: any;
    yMin?: any;
    units?: string;
    xGridlines?: string;
    yGridlines?: string;
    xAxisTitle?: string;
    series?: any;
    outlineColor?: any;
    outlineWidth?: any;
    outlineTransparency?: any;
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
        data: any;
        x?: any;
        y?: any;
        legend?: string;
        fillColor?: any;
        fillTransparency?: any;
        yMin?: any;
        units?: string;
        xGridlines?: string;
        yGridlines?: string;
        xAxisTitle?: string;
        series?: any;
        outlineColor?: any;
        outlineWidth?: any;
        outlineTransparency?: any;
        pointSize?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
