import { it, describe, expect } from 'vitest';
import { PluginConfigSchema } from './plugin-config.schema.js';

describe('PluginConfigSchema', () => {
	it('should pass on an empty object configuration', () => {
		const v = {};
		expect(() => PluginConfigSchema.parse(v)).not.toThrowError();
	});
	it('should pass when only a layout is provided', () => {
		const v = { layout: '' };
		expect(() => PluginConfigSchema.parse(v)).not.toThrowError();
	});
	it('should pass when only components are provided', () => {
		const v = { components: {} };
		expect(() => PluginConfigSchema.parse(v)).not.toThrowError();
	});
	it('should pass when only sources are provided', () => {
		const v = { sources: {} };
		expect(() => PluginConfigSchema.parse(v)).not.toThrowError();
	});
});
