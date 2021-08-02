/** @typedef {typeof __propDef.props}  LogoProps */
/** @typedef {typeof __propDef.events}  LogoEvents */
/** @typedef {typeof __propDef.slots}  LogoSlots */
export default class Logo extends SvelteComponentTyped<{
    organization?: string;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type LogoProps = typeof __propDef.props;
export type LogoEvents = typeof __propDef.events;
export type LogoSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        organization?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
