/** @typedef {typeof __propDef.props}  BarProps */
/** @typedef {typeof __propDef.events}  BarEvents */
/** @typedef {typeof __propDef.slots}  BarSlots */
export default class Bar extends SvelteComponentTyped<{
    filter?: any;
    fillColor?: string;
    fillTransparency?: number;
    series?: any;
    outlineColor?: string;
    outlineWidth?: number;
    stackOrder?: string;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type BarProps = typeof __propDef.props;
export type BarEvents = typeof __propDef.events;
export type BarSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        filter?: any;
        fillColor?: string;
        fillTransparency?: number;
        series?: any;
        outlineColor?: string;
        outlineWidth?: number;
        stackOrder?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
