/** @typedef {typeof __propDef.props}  ChartProps */
/** @typedef {typeof __propDef.events}  ChartEvents */
/** @typedef {typeof __propDef.slots}  ChartSlots */
export default class Chart extends SvelteComponentTyped<{
    title?: any;
    legend?: boolean;
    sort?: boolean;
    size?: any;
    data?: any;
    x?: string;
    horiz?: boolean;
    y?: string | string[];
    series?: any;
    options?: any;
    chartType?: string;
    yMin?: any;
    subtitle?: any;
    bubble?: boolean;
    hist?: boolean;
    xType?: any;
    xAxisTitle?: string;
    xBaseline?: boolean;
    xTickMarks?: boolean;
    xGridlines?: boolean;
    xAxisLabels?: boolean;
    yAxisTitle?: string;
    yBaseline?: boolean;
    yTickMarks?: boolean;
    yGridlines?: boolean;
    yAxisLabels?: boolean;
}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {};
}> {
}
export type ChartProps = typeof __propDef.props;
export type ChartEvents = typeof __propDef.events;
export type ChartSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        title?: any;
        legend?: boolean;
        sort?: boolean;
        size?: any;
        data?: any;
        x?: string;
        horiz?: boolean;
        y?: string | string[];
        series?: any;
        options?: any;
        chartType?: string;
        yMin?: any;
        subtitle?: any;
        bubble?: boolean;
        hist?: boolean;
        xType?: any;
        xAxisTitle?: string;
        xBaseline?: boolean;
        xTickMarks?: boolean;
        xGridlines?: boolean;
        xAxisLabels?: boolean;
        yAxisTitle?: string;
        yBaseline?: boolean;
        yTickMarks?: boolean;
        yGridlines?: boolean;
        yAxisLabels?: boolean;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
import { props } from "../modules/stores.js";
export {};
