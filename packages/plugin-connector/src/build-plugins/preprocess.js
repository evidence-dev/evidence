/**
 * TODO: Can we do this all in one processor, or do we need multiple?
 * @type {() => import("svelte/types/compiler/preprocess").PreprocessorGroup}
 */
export const evidencePlugins = () => {
    return {
        /** @type {import("svelte/types/compiler/preprocess").MarkupPreprocessor}} */
        markup: async () => {
            
        },
        /** @type {import("svelte/types/compiler/preprocess").Preprocessor}} */
        style: async () => {

        },
        /** @type {import("svelte/types/compiler/preprocess").Preprocessor}} */
        script: async () => {

        }
    }
};
