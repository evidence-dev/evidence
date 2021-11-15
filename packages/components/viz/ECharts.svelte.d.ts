/** @typedef {typeof __propDef.props}  EChartsProps */
/** @typedef {typeof __propDef.events}  EChartsEvents */
/** @typedef {typeof __propDef.slots}  EChartsSlots */
export default class ECharts extends SvelteComponentTyped<{
    config?: any;
    height?: string;
    width?: string;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type EChartsProps = typeof __propDef.props;
export type EChartsEvents = typeof __propDef.events;
export type EChartsSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        config?: any;
        height?: string;
        width?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
