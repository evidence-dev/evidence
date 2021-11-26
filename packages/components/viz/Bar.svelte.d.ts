/** @typedef {typeof __propDef.props}  BarProps */
/** @typedef {typeof __propDef.events}  BarEvents */
/** @typedef {typeof __propDef.slots}  BarSlots */
export default class Bar extends SvelteComponentTyped<{
    name?: any;
    y?: any;
    series?: any;
    options?: any;
    fillColor?: any;
    fillOpacity?: any;
    type?: string;
    stackName?: string;
    outlineColor?: any;
    outlineWidth?: any;
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
        name?: any;
        y?: any;
        series?: any;
        options?: any;
        fillColor?: any;
        fillOpacity?: any;
        type?: string;
        stackName?: string;
        outlineColor?: any;
        outlineWidth?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
import { props } from "../modules/stores.js";
export {};
