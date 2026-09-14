import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { MAPLIBRE_GL_VERSION } from './maplibre-cdn';

const require = createRequire(import.meta.url);

// The CDN worker must track the npm-resolved version — fails when a Dependabot bump moves only the npm side.
describe('MapLibre GL version pin', () => {
	it('matches the maplibre-gl version core actually resolves from npm', () => {
		const installed = require('maplibre-gl/package.json').version as string;

		expect(MAPLIBRE_GL_VERSION).toBe(installed);
	});
});
