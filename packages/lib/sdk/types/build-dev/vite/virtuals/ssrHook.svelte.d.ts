export function ssrHook(presentQueries: Array<{
    name: string;
    queryString: string;
}>): (chunk: {
    html: string;
    done: boolean;
}) => Promise<string>;
//# sourceMappingURL=ssrHook.svelte.d.ts.map