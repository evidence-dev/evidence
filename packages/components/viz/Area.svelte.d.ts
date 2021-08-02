/** @typedef {typeof __propDef.props}  AreaProps */
/** @typedef {typeof __propDef.events}  AreaEvents */
/** @typedef {typeof __propDef.slots}  AreaSlots */
export default class Area extends SvelteComponentTyped<{
    fillColor?: string;
    fillTransparency?: number;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type AreaProps = typeof __propDef.props;
export type AreaEvents = typeof __propDef.events;
export type AreaSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        fillColor?: string;
        fillTransparency?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
