/** @typedef {typeof __propDef.props}  PrismjsProps */
/** @typedef {typeof __propDef.events}  PrismjsEvents */
/** @typedef {typeof __propDef.slots}  PrismjsSlots */
export default class Prismjs extends SvelteComponentTyped<{
    language: any;
    code: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type PrismjsProps = typeof __propDef.props;
export type PrismjsEvents = typeof __propDef.events;
export type PrismjsSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        language: any;
        code: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
