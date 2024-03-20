import { it, describe, expect } from 'vitest';
import { PluginPackageSchema } from './plugin-package.schema.js';

describe('PluginPackageSchema', () => {
	it('should fail when an invalid icon is given', () => {
		const v = {
			name: 'some-package',
			main: 'index.js',
			version: '0.0.1',
			license: 'MIT',
			evidence: {
				icon: 'Invalid Icon'
			}
		};
		expect(() => PluginPackageSchema.parse(v)).toThrowError('An invalid icon name was provided');
	});
	it('should pass when a valid icon is given', () => {
		/** @type {import("zod").infer<typeof PluginPackageSchema>} */
		const v = {
			name: 'some-package',
			main: 'index.js',
			version: '0.0.1',
			license: 'MIT',
			evidence: {
				icon: 'Postgresql'
			}
		};
		expect(() => PluginPackageSchema.parse(v)).not.toThrowError();
	});
});
