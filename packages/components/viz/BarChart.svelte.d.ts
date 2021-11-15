/** @typedef {typeof __propDef.props}  BarChartProps */
/** @typedef {typeof __propDef.events}  BarChartEvents */
/** @typedef {typeof __propDef.slots}  BarChartSlots */
export default class BarChart extends SvelteComponentTyped<{
    title?: any;
    legend?: boolean;
    sort?: any;
    data?: any;
    x?: any;
    horiz?: any;
    y?: any;
    series?: any;
    fillColor?: any;
    fillOpacity?: any;
    yMin?: any;
    subtitle?: any;
    xType?: string;
    xAxisTitle?: any;
    xGridlines?: any;
    yAxisTitle?: any;
    yGridlines?: any;
    type?: any;
    outlineColor?: any;
    outlineWidth?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type BarChartProps = typeof __propDef.props;
export type BarChartEvents = typeof __propDef.events;
export type BarChartSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        title?: any;
        legend?: boolean;
        sort?: any;
        data?: any;
        x?: any;
        horiz?: any;
        y?: any;
        series?: any;
        fillColor?: any;
        fillOpacity?: any;
        yMin?: any;
        subtitle?: any;
        xType?: string;
        xAxisTitle?: any;
        xGridlines?: any;
        yAxisTitle?: any;
        yGridlines?: any;
        type?: any;
        outlineColor?: any;
        outlineWidth?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
