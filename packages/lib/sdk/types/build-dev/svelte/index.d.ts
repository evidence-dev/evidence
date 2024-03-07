export function svelte(opts?: EvidencePreprocessOptions): import("svelte/types/compiler/preprocess").PreprocessorGroup;
export type EvidencePreprocessOptions = {
    /**
     * If false, disables the b64 escaping of codeblock content
     */
    escapeCode?: boolean | undefined;
    /**
     * If false, disables the auto highlight of code blocks
     */
    highlight?: boolean | undefined;
};
//# sourceMappingURL=index.d.ts.map