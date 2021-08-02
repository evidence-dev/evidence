/** @typedef {typeof __propDef.props}  ColumnProps */
/** @typedef {typeof __propDef.events}  ColumnEvents */
/** @typedef {typeof __propDef.slots}  ColumnSlots */
export default class Column extends SvelteComponentTyped<{
    filter?: any;
    fillColor?: string;
    fillTransparency?: number;
    series?: any;
    outlineColor?: string;
    outlineWidth?: number;
    stackOrder?: string;
    binMax?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type ColumnProps = typeof __propDef.props;
export type ColumnEvents = typeof __propDef.events;
export type ColumnSlots = typeof __propDef.slots;
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
        binMax?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
