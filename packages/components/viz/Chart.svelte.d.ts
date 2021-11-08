/** @typedef {typeof __propDef.props}  ChartProps */
/** @typedef {typeof __propDef.events}  ChartEvents */
/** @typedef {typeof __propDef.slots}  ChartSlots */
export default class Chart extends SvelteComponentTyped<{
    x: any;
    y: any;
    data: any;
    width?: string;
    height?: number;
    sort?: any;
    paddingRight?: number;
    reverseAxes?: boolean;
    heightMultiplier?: any;
    marginTop?: string;
    marginBottom?: string;
    paddingLeft?: number;
    paddingTop?: number;
    paddingBottom?: number;
    xType?: string;
    yType?: string;
    groupType?: any;
    yMin?: any;
    yMax?: any;
    xMin?: any;
    xMax?: any;
    sortBy?: any;
    sortOrder?: string;
}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {};
}> {
}
export type ChartProps = typeof __propDef.props;
export type ChartEvents = typeof __propDef.events;
export type ChartSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        x: any;
        y: any;
        data: any;
        width?: string;
        height?: number;
        sort?: any;
        paddingRight?: number;
        reverseAxes?: boolean;
        heightMultiplier?: any;
        marginTop?: string;
        marginBottom?: string;
        paddingLeft?: number;
        paddingTop?: number;
        paddingBottom?: number;
        xType?: string;
        yType?: string;
        groupType?: any;
        yMin?: any;
        yMax?: any;
        xMin?: any;
        xMax?: any;
        sortBy?: any;
        sortOrder?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
export {};
