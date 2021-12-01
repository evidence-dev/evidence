/** @typedef {typeof __propDef.props}  CompilerToggleProps */
/** @typedef {typeof __propDef.events}  CompilerToggleEvents */
/** @typedef {typeof __propDef.slots}  CompilerToggleSlots */
export default class CompilerToggle extends SvelteComponentTyped<{
    showCompiled: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type CompilerToggleProps = typeof __propDef.props;
export type CompilerToggleEvents = typeof __propDef.events;
export type CompilerToggleSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        showCompiled: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
