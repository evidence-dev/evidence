/** @typedef {typeof __propDef.props}  BubbleChartProps */
/** @typedef {typeof __propDef.events}  BubbleChartEvents */
/** @typedef {typeof __propDef.slots}  BubbleChartSlots */
export default class BubbleChart extends SvelteComponentTyped<{
    data: any;
    x?: any;
    y?: any;
    legend?: string;
    size?: any;
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
    minPointSize?: any;
    maxPointSize?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type BubbleChartProps = typeof __propDef.props;
export type BubbleChartEvents = typeof __propDef.events;
export type BubbleChartSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        data: any;
        x?: any;
        y?: any;
        legend?: string;
        size?: any;
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
        minPointSize?: any;
        maxPointSize?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
