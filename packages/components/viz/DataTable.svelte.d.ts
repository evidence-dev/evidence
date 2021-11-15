/** @typedef {typeof __propDef.props}  DataTableProps */
/** @typedef {typeof __propDef.events}  DataTableEvents */
/** @typedef {typeof __propDef.slots}  DataTableSlots */
export default class DataTable extends SvelteComponentTyped<{
    data?: any;
    rows?: number;
    marginTop?: string;
    marginBottom?: string;
    rowNumbers?: string;
    rowLines?: string;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type DataTableProps = typeof __propDef.props;
export type DataTableEvents = typeof __propDef.events;
export type DataTableSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        data?: any;
        rows?: number;
        marginTop?: string;
        marginBottom?: string;
        rowNumbers?: string;
        rowLines?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
