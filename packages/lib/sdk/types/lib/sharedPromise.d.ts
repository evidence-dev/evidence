export function sharedPromise<ResolveType = unknown>(stateChangeHook?: (() => void) | undefined): SharedPromise<ResolveType>;
export type SharedPromise<ResolveType = unknown> = {
    promise: Promise<ResolveType>;
    resolve: (v: ResolveType) => unknown;
    reject: (e: Error) => unknown;
    state: 'init' | 'loading' | 'resolved' | 'rejected';
    value: ResolveType | null;
    start: () => void;
};
//# sourceMappingURL=sharedPromise.d.ts.map