/** @typedef {typeof __propDef.props}  QueryDataTableProps */
/** @typedef {typeof __propDef.events}  QueryDataTableEvents */
/** @typedef {typeof __propDef.slots}  QueryDataTableSlots */
export default class QueryDataTable extends SvelteComponentTyped<{
    data: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type QueryDataTableProps = typeof __propDef.props;
export type QueryDataTableEvents = typeof __propDef.events;
export type QueryDataTableSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        data: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
