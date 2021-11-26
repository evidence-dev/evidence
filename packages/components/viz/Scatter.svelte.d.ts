/** @typedef {typeof __propDef.props}  ScatterProps */
/** @typedef {typeof __propDef.events}  ScatterEvents */
/** @typedef {typeof __propDef.slots}  ScatterSlots */
export default class Scatter extends SvelteComponentTyped<{
    name?: any;
    y?: any;
    series?: any;
    options?: any;
    fillColor?: any;
    outlineColor?: any;
    outlineWidth?: any;
    shape?: string;
    opacity?: number;
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
        name?: any;
        y?: any;
        series?: any;
        options?: any;
        fillColor?: any;
        outlineColor?: any;
        outlineWidth?: any;
        shape?: string;
        opacity?: number;
        pointSize?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
import { props } from "../modules/stores.js";
export {};
