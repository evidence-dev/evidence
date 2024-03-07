import { describe, it, expect } from 'vitest';
import { Datasources } from './Datasources.js';

describe('Datasources', () => {
	it('should be a class', () => {
		expect(new Datasources()).toBeDefined();
	});

	it('should throw if an invalid package is given', () => {
		const datasources = new Datasources();
		const pack = { evidence: { datasources: [] }, name: 'test-package' };

		expect(() => datasources.add(pack, {})).toThrowError();
	});

	it('should add a datasource', () => {
		const datasources = new Datasources();
		const pack = { evidence: { datasources: ['ddb'] }, name: 'test-package' };
		const source = {};

		datasources.add(pack, source);
		let [_pack, _source] = datasources.getByPackageName(pack.name);

		expect(_pack).toBe(pack);
		expect(_source).toBe(source);

		[_pack, _source] = datasources.getBySource('ddb');
		expect(_pack).toBe(pack);
		expect(_source).toBe(source);
	});

	it('should add a datasource', () => {
		const datasources = new Datasources();
		const pack = { evidence: { datasources: ['ddb'] }, name: 'test-package' };
		const source = {};

		datasources.add(pack, source);
		const result = datasources.getByPackageName(pack.name);
		expect(result).toBeDefined();
		expect(result[0]).toBe(pack);
		expect(result[1]).toBe(source);
	});

	describe('overrides', () => {
		it('should always return the override package', () => {
			const datasources = new Datasources();
			const pack = { evidence: { datasources: ['ddb'] }, name: 'test-package' };
			const pack2 = { evidence: { datasources: ['ddb'] }, name: 'test-package-2' };

			const source1 = { name: 1 };
			const source2 = { name: 2 };
			datasources.add(pack, source1, ['ddb']);
			datasources.add(pack2, source2);

			const result = datasources.getByPackageName(pack.name);
			expect(result).toBeDefined();
			expect(result[0]).toBe(pack);
			expect(result[1]).toBe(source1);
		});
		it('should throw if a source is overriden twice', () => {
			const datasources = new Datasources();
			const pack = { evidence: { datasources: ['ddb'] }, name: 'test-package' };
			const pack2 = { evidence: { datasources: ['ddb'] }, name: 'test-package-2' };

			const source1 = { name: 1 };
			const source2 = { name: 2 };
			datasources.add(pack, source1, ['ddb']);
			// Adding pack2 throws
			expect(() => datasources.add(pack2, source2, ['ddb'])).toThrowError();

			//	pack is still accessible
			const result = datasources.getByPackageName(pack.name);
			expect(result).toBeDefined();
			expect(result[0]).toBe(pack);
			expect(result[1]).toBe(source1);
		});
	});
});
