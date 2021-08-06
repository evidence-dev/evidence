/** @typedef {typeof __propDef.props}  BarChartProps */
/** @typedef {typeof __propDef.events}  BarChartEvents */
/** @typedef {typeof __propDef.slots}  BarChartSlots */
export default class BarChart extends SvelteComponentTyped<{
    data: any;
    x?: any;
    y?: any;
    sort?: string;
    legend?: string;
    fillColor?: any;
    fillTransparency?: any;
    yMin?: number;
    units?: string;
    xGridlines?: string;
    yGridlines?: string;
    series?: any;
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
        data: any;
        x?: any;
        y?: any;
        sort?: string;
        legend?: string;
        fillColor?: any;
        fillTransparency?: any;
        yMin?: number;
        units?: string;
        xGridlines?: string;
        yGridlines?: string;
        series?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
