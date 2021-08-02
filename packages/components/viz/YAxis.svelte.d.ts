/** @typedef {typeof __propDef.props}  YAxisProps */
/** @typedef {typeof __propDef.events}  YAxisEvents */
/** @typedef {typeof __propDef.slots}  YAxisSlots */
export default class YAxis extends SvelteComponentTyped<{
    ticks?: number;
    xTick?: number;
    yTick?: number;
    dxTick?: number;
    dyTick?: number;
    gridlines?: string;
    gridlineColor?: string;
    gridlineDashSize?: number;
    baseline?: boolean;
    baselineColor?: string;
    tickMarks?: string;
    tickMarkColor?: any;
    labels?: string;
    labelColor?: string;
    labelSize?: string;
    axisPosition?: string;
    units?: string;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type YAxisProps = typeof __propDef.props;
export type YAxisEvents = typeof __propDef.events;
export type YAxisSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        ticks?: number;
        xTick?: number;
        yTick?: number;
        dxTick?: number;
        dyTick?: number;
        gridlines?: string;
        gridlineColor?: string;
        gridlineDashSize?: number;
        baseline?: boolean;
        baselineColor?: string;
        tickMarks?: string;
        tickMarkColor?: any;
        labels?: string;
        labelColor?: string;
        labelSize?: string;
        axisPosition?: string;
        units?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
