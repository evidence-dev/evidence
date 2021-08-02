/** @typedef {typeof __propDef.props}  BubbleProps */
/** @typedef {typeof __propDef.events}  BubbleEvents */
/** @typedef {typeof __propDef.slots}  BubbleSlots */
export default class Bubble extends SvelteComponentTyped<{
    filter?: any;
    size?: any;
    fillColor?: string;
    fillTransparency?: number;
    reverseAxes?: string;
    series?: any;
    outlineColor?: string;
    outlineWidth?: number;
    outlineTransparency?: number;
    minPointSize?: number;
    maxPointSize?: number;
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
        filter?: any;
        size?: any;
        fillColor?: string;
        fillTransparency?: number;
        reverseAxes?: string;
        series?: any;
        outlineColor?: string;
        outlineWidth?: number;
        outlineTransparency?: number;
        minPointSize?: number;
        maxPointSize?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
