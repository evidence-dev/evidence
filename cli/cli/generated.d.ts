// The SvelteKit server bundle is emitted by the adapter at build time and
// doesn't exist when typechecking; call sites cast the import.
declare module '*/server/index.js';
