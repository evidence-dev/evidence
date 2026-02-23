// Folder-level rendering policy for all dashboard routes.
// Sub-pages can still override these values in their own +page.js files.
const runtimeSSR = import.meta.env.EVIDENCE_RUNTIME_SSR === 'true';

export const ssr = true;
export const csr = true;
export const prerender = !runtimeSSR;
