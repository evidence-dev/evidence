/** @typedef {typeof __propDef.props}  AreaProps */
/** @typedef {typeof __propDef.events}  AreaEvents */
/** @typedef {typeof __propDef.slots}  AreaSlots */
export default class Area extends SvelteComponentTyped<{
    line?: boolean;
    name?: any;
    y?: any;
    series?: any;
    options?: any;
    fillColor?: any;
    fillOpacity?: any;
    missing?: string;
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
        line?: boolean;
        name?: any;
        y?: any;
        series?: any;
        options?: any;
        fillColor?: any;
        fillOpacity?: any;
        missing?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
import { props } from "../modules/stores.js";
export {};
