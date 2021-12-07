/** @typedef {typeof __propDef.props}  QueryViewerProps */
/** @typedef {typeof __propDef.events}  QueryViewerEvents */
/** @typedef {typeof __propDef.slots}  QueryViewerSlots */
export default class QueryViewer extends SvelteComponentTyped<{
    queryID: any;
    pageQueries: any;
    queryResult: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> {
}
export type QueryViewerProps = typeof __propDef.props;
export type QueryViewerEvents = typeof __propDef.events;
export type QueryViewerSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        queryID: any;
        pageQueries: any;
        queryResult: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export {};
