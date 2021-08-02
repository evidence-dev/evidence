/** @typedef {typeof __propDef.props}  ScatterProps */
/** @typedef {typeof __propDef.events}  ScatterEvents */
/** @typedef {typeof __propDef.slots}  ScatterSlots */
export default class Scatter extends SvelteComponentTyped<{
    filter?: any;
    fillColor?: string;
    fillTransparency?: number;
    reverseAxes?: string;
    series?: any;
    outlineColor?: string;
    outlineWidth?: number;
    outlineTransparency?: number;
    pointSize?: number;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type ScatterProps = typeof __propDef.props;
export type ScatterEvents = typeof __propDef.events;
export type ScatterSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        filter?: any;
        fillColor?: string;
        fillTransparency?: number;
        reverseAxes?: string;
        series?: any;
        outlineColor?: string;
        outlineWidth?: number;
        outlineTransparency?: number;
        pointSize?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
