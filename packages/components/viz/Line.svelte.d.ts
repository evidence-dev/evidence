/** @typedef {typeof __propDef.props}  LineProps */
/** @typedef {typeof __propDef.events}  LineEvents */
/** @typedef {typeof __propDef.slots}  LineSlots */
export default class Line extends SvelteComponentTyped<{
    filter?: any;
    series?: any;
    lineLabel?: any;
    lineColor?: string;
    lineWidth?: number;
    lineDashSize?: number;
    lineTransparency?: number;
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
        filter?: any;
        series?: any;
        lineLabel?: any;
        lineColor?: string;
        lineWidth?: number;
        lineDashSize?: number;
        lineTransparency?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
