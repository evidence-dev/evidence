import { beforeEach, it, expect, describe, vi } from 'vitest';
import { subSourceVariables } from './sub-source-vars';

describe('subSourceVars', () => {
	beforeEach(() => {
		vi.unstubAllEnvs();
	});
	it('should leave queries without any variables untouched', () => {
		expect(subSourceVariables('Hi!')).toEqual('Hi!');
	});

	it('should replace variables that are found in the environment', () => {
		vi.stubEnv('EVIDENCE_VAR__test', 'var-val');
		expect(subSourceVariables('${test}')).toEqual('var-val');
	});
	it('should replace multiple variables that are found in the environment', () => {
		vi.stubEnv('EVIDENCE_VAR__test', 'var-val');

		expect(subSourceVariables('${test}\n${test}')).toEqual('var-val\nvar-val');
	});
	it('should replace $${ with ${ but not sub the variable', () => {
		vi.stubEnv('EVIDENCE_VAR__test', 'var-val');
		expect(subSourceVariables('$${test}\n${test}')).toEqual('${test}\nvar-val');
	});
});
