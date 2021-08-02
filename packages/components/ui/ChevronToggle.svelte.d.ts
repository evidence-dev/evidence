/** @typedef {typeof __propDef.props}  ChevronToggleProps */
/** @typedef {typeof __propDef.events}  ChevronToggleEvents */
/** @typedef {typeof __propDef.slots}  ChevronToggleSlots */
export default class ChevronToggle extends SvelteComponentTyped<{
    toggled?: boolean;
    color?: string;
    size?: number;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type ChevronToggleProps = typeof __propDef.props;
export type ChevronToggleEvents = typeof __propDef.events;
export type ChevronToggleSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        toggled?: boolean;
        color?: string;
        size?: number;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
