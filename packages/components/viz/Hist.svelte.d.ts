/** @typedef {typeof __propDef.props}  HistProps */
/** @typedef {typeof __propDef.events}  HistEvents */
/** @typedef {typeof __propDef.slots}  HistSlots */
export default class Hist extends SvelteComponentTyped<{
    data: any[];
    x?: any;
    fillColor?: any;
    fillTransparency?: any;
    yMin?: number;
    units?: string;
    xGridlines?: string;
    yGridlines?: string;
    xAxisTitle?: string;
    binCount?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type HistProps = typeof __propDef.props;
export type HistEvents = typeof __propDef.events;
export type HistSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        data: any[];
        x?: any;
        fillColor?: any;
        fillTransparency?: any;
        yMin?: number;
        units?: string;
        xGridlines?: string;
        yGridlines?: string;
        xAxisTitle?: string;
        binCount?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
