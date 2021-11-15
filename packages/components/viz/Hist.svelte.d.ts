/** @typedef {typeof __propDef.props}  HistProps */
/** @typedef {typeof __propDef.events}  HistEvents */
/** @typedef {typeof __propDef.slots}  HistSlots */
export default class Hist extends SvelteComponentTyped<{
    x?: any;
    fillColor?: any;
    fillOpacity?: number;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type HistProps = typeof __propDef.props;
export type HistEvents = typeof __propDef.events;
export type HistSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        x?: any;
        fillColor?: any;
        fillOpacity?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
import { props } from "../modules/stores.js";
export {};
