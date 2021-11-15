/** @typedef {typeof __propDef.props}  LineProps */
/** @typedef {typeof __propDef.events}  LineEvents */
/** @typedef {typeof __propDef.slots}  LineSlots */
export default class Line extends SvelteComponentTyped<{
    y?: any;
    series?: any;
    options?: any;
    name?: any;
    lineColor?: any;
    lineWidth?: number;
    lineType?: string;
    lineOpacity?: any;
    markers?: boolean;
    markerShape?: string;
    markerSize?: number;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type LineProps = typeof __propDef.props;
export type LineEvents = typeof __propDef.events;
export type LineSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        y?: any;
        series?: any;
        options?: any;
        name?: any;
        lineColor?: any;
        lineWidth?: number;
        lineType?: string;
        lineOpacity?: any;
        markers?: boolean;
        markerShape?: string;
        markerSize?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
import { props } from "../modules/stores.js";
export {};
