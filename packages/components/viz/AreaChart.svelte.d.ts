/** @typedef {typeof __propDef.props}  AreaChartProps */
/** @typedef {typeof __propDef.events}  AreaChartEvents */
/** @typedef {typeof __propDef.slots}  AreaChartSlots */
export default class AreaChart extends SvelteComponentTyped<{
    data: any;
    x?: any;
    y?: any;
    fillColor?: any;
    fillTransparency?: any;
    xType?: any;
    yType?: any;
    yMin?: number;
    units?: string;
    xGridlines?: string;
    yGridlines?: string;
    xAxisTitle?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type AreaChartProps = typeof __propDef.props;
export type AreaChartEvents = typeof __propDef.events;
export type AreaChartSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        data: any;
        x?: any;
        y?: any;
        fillColor?: any;
        fillTransparency?: any;
        xType?: any;
        yType?: any;
        yMin?: number;
        units?: string;
        xGridlines?: string;
        yGridlines?: string;
        xAxisTitle?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
