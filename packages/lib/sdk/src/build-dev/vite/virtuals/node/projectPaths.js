import path from 'path';

export const URL_PREFIX = '_evidence';

export const inTemplate = process.cwd().includes(path.join('.evidence', 'template'));

export const evidenceDirectory = inTemplate ? '..' : '.evidence';

export const dataDirectory = path.resolve(evidenceDirectory, 'data');

export const metaDirectory = path.resolve(evidenceDirectory, 'meta');

export const sourcesDirectory = path.resolve(...(inTemplate ? ['..', '..'] : []), 'sources');
