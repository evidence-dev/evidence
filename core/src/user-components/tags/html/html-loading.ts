/**
 * Fallback delays for {@link HtmlLoadingShell}: reveal sandboxed content even
 * when the author never calls `evidence.ready()`.
 *
 * Modal: short — covers iframe boot flash only.
 * Inline: longer — warehouse `evidence.query` often takes seconds; keep the
 * placeholder until ready() (or this ceiling). Aligns with SandboxFrame's 20s
 * render-task safety net.
 */
export const MODAL_HTML_LOADING_FALLBACK_MS = 600;
export const INLINE_HTML_LOADING_FALLBACK_MS = 20_000;
