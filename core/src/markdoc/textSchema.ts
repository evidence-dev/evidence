import Markdoc from '@markdoc/markdoc';

/**
 * Text node schema. The "HTML tags not supported" validation that used to
 * live here moved to a custom walker in `Renderer/MarkdocProcessor/process-markdoc.ts`
 * (`validateNoHtmlTags`) — Markdoc's native validate() pass invokes
 * `validate(node)` without a parent reference, so it couldn't distinguish a
 * text node in normal markdown (HTML should be rejected) from a text node
 * inside an opaque-body tag like `custom_echart`'s JSON5 body (a tooltip
 * formatter `'<b>{c}</b>'` is HTML-IN-A-STRING, not Markdown-with-HTML, and
 * the per-tag validators handle it).
 *
 * The walker uses `shouldSkipChildren` to descend only into Markdown content,
 * so the same rule applies to text consistently AND respects bodyLanguage.
 */
export const textSchema = {
	...Markdoc.nodes.text
};
