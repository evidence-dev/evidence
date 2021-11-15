/** @typedef {typeof __propDef.props}  BubbleProps */
/** @typedef {typeof __propDef.events}  BubbleEvents */
/** @typedef {typeof __propDef.slots}  BubbleSlots */
export default class Bubble extends SvelteComponentTyped<{
    size?: any;
    y?: any;
    series?: any;
    options?: any;
    name?: any;
    fillColor?: any;
    outlineColor?: any;
    outlineWidth?: any;
    shape?: any;
    opacity?: number;
    minSize?: number;
    maxSize?: number;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type BubbleProps = typeof __propDef.props;
export type BubbleEvents = typeof __propDef.events;
export type BubbleSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        size?: any;
        y?: any;
        series?: any;
        options?: any;
        name?: any;
        fillColor?: any;
        outlineColor?: any;
        outlineWidth?: any;
        shape?: any;
        opacity?: number;
        minSize?: number;
        maxSize?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
import { props } from "../modules/stores.js";
export {};
