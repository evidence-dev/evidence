/**
 * Path the html sandbox runtime bundle is served from. Every host app emits it
 * there from the shared manifest (core/src/user-components/sandbox/sandbox-runtimes.js).
 * Lives in this file rather than inline so the build and the consumer both
 * import from one source.
 */
export const SANDBOX_RUNTIME_PATH = '/sandbox/html-runtime.js';
