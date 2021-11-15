/** @typedef {typeof __propDef.props}  BubbleChartProps */
/** @typedef {typeof __propDef.events}  BubbleChartEvents */
/** @typedef {typeof __propDef.slots}  BubbleChartSlots */
export default class BubbleChart extends SvelteComponentTyped<{
    title?: any;
    legend?: boolean;
    size?: any;
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
    minSize?: any;
    maxSize?: any;
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
        title?: any;
        legend?: boolean;
        size?: any;
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
        minSize?: any;
        maxSize?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
