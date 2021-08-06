/** @typedef {typeof __propDef.props}  XAxisProps */
/** @typedef {typeof __propDef.events}  XAxisEvents */
/** @typedef {typeof __propDef.slots}  XAxisSlots */
export default class XAxis extends SvelteComponentTyped<{
    snapTicks?: boolean;
    ticks?: number;
    xTick?: any;
    yTick?: number;
    dxTick?: number;
    dyTick?: number;
    gridlines?: string;
    gridlineColor?: string;
    gridlineDashSize?: number;
    baseline?: boolean;
    baselineColor?: string;
    axisTitle?: string;
    tickMarks?: any;
    tickMarkColor?: any;
    labels?: string;
    labelColor?: string;
    labelSize?: string;
    labelPosition?: string;
    axisPosition?: string;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type XAxisProps = typeof __propDef.props;
export type XAxisEvents = typeof __propDef.events;
export type XAxisSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        snapTicks?: boolean;
        ticks?: number;
        xTick?: any;
        yTick?: number;
        dxTick?: number;
        dyTick?: number;
        gridlines?: string;
        gridlineColor?: string;
        gridlineDashSize?: number;
        baseline?: boolean;
        baselineColor?: string;
        axisTitle?: string;
        tickMarks?: any;
        tickMarkColor?: any;
        labels?: string;
        labelColor?: string;
        labelSize?: string;
        labelPosition?: string;
        axisPosition?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
