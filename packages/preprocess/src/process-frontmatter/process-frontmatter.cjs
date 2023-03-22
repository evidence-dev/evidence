const {readFile} = require("fs/promises")

/**
 * @type {(componentDevelopmentMode: boolean) => import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
module.exports = () => {
    /**
     * This ensures that we don't read ./handle-og.svelte more than once
     * @type {string}
     */
    let handleOgContent
    return {
        markup: async ({content, filename}) => {
            if (typeof filename !== "undefined" && filename.endsWith("+page.md")) {
                if (!handleOgContent) handleOgContent = await readFile(`${__dirname}/handle-og.svelte`)
                return {
                    code: content + handleOgContent
                }
            }
        },
    }
}
