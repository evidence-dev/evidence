/** @typedef {typeof __propDef.props}  BaseLayoutProps */
/** @typedef {typeof __propDef.events}  BaseLayoutEvents */
/** @typedef {typeof __propDef.slots}  BaseLayoutSlots */
export default class BaseLayout extends SvelteComponentTyped<{}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {};
}> {
}
export type BaseLayoutProps = typeof __propDef.props;
export type BaseLayoutEvents = typeof __propDef.events;
export type BaseLayoutSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {};
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
export {};
