/** @typedef {typeof __propDef.props}  HistogramProps */
/** @typedef {typeof __propDef.events}  HistogramEvents */
/** @typedef {typeof __propDef.slots}  HistogramSlots */
export default class Histogram extends SvelteComponentTyped<{
    title?: any;
    legend?: boolean;
    data?: any;
    x?: any;
    fillColor?: any;
    fillOpacity?: any;
    yMin?: number;
    subtitle?: any;
    xAxisTitle?: any;
    xBaseline?: any;
    xTickMarks?: any;
    xGridlines?: any;
    yAxisTitle?: any;
    yBaseline?: any;
    yTickMarks?: any;
    yGridlines?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type HistogramProps = typeof __propDef.props;
export type HistogramEvents = typeof __propDef.events;
export type HistogramSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        title?: any;
        legend?: boolean;
        data?: any;
        x?: any;
        fillColor?: any;
        fillOpacity?: any;
        yMin?: number;
        subtitle?: any;
        xAxisTitle?: any;
        xBaseline?: any;
        xTickMarks?: any;
        xGridlines?: any;
        yAxisTitle?: any;
        yBaseline?: any;
        yTickMarks?: any;
        yGridlines?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
