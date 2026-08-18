// Client-safe exports
export { process, parse, validate, transform, serializeTree, deserializeTree } from './process';
export { config } from './config';
export { default as Renderer } from '@evidence/core/user-components/Renderer/Renderer.svelte';

// Server-only exports are in files.server.ts - import directly:
// import { getMarkdownFile, getHomeFile } from '$lib/markdown/files.server';
