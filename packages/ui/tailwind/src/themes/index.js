import { loadThemes } from './loadThemes.js';
export * from './vite-plugin/index.js';

export const themes = loadThemes();

/** @typedef {import('./schemas.js').Theme} Theme */
/** @typedef {import('./schemas.js').Themes} Themes */
