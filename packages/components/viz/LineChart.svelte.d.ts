/** @typedef {typeof __propDef.props}  LineChartProps */
/** @typedef {typeof __propDef.events}  LineChartEvents */
/** @typedef {typeof __propDef.slots}  LineChartSlots */
export default class LineChart extends SvelteComponentTyped<{
    data: any;
    x?: any;
    y?: any;
    legend?: string;
    yMin?: number;
    units?: string;
    xGridlines?: string;
    yGridlines?: string;
    xAxisTitle?: string;
    series?: any;
    lineLabel?: any;
    lineColor?: any;
    lineWidth?: any;
    lineDashSize?: any;
    lineTransparency?: any;
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
        data: any;
        x?: any;
        y?: any;
        legend?: string;
        yMin?: number;
        units?: string;
        xGridlines?: string;
        yGridlines?: string;
        xAxisTitle?: string;
        series?: any;
        lineLabel?: any;
        lineColor?: any;
        lineWidth?: any;
        lineDashSize?: any;
        lineTransparency?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
