/** @typedef {typeof __propDef.props}  ColumnChartProps */
/** @typedef {typeof __propDef.events}  ColumnChartEvents */
/** @typedef {typeof __propDef.slots}  ColumnChartSlots */
export default class ColumnChart extends SvelteComponentTyped<{
    data: any;
    x?: any;
    y?: any;
    sort?: string;
    legend?: string;
    fillColor?: any;
    fillTransparency?: any;
    xType?: string;
    yMin?: number;
    units?: string;
    xGridlines?: string;
    yGridlines?: string;
    series?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type ColumnChartProps = typeof __propDef.props;
export type ColumnChartEvents = typeof __propDef.events;
export type ColumnChartSlots = typeof __propDef.slots;
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
        xType?: string;
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
