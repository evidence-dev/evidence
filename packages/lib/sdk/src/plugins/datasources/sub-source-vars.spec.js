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
	it('should replace the same variables that are found in multiple places', () => {
		vi.stubEnv('EVIDENCE_VAR__test', 'var-val');

		expect(subSourceVariables('${test}\n${test}')).toEqual('var-val\nvar-val');
	});
	it('should replace $${ with ${ but not sub the variable', () => {
		vi.stubEnv('EVIDENCE_VAR__test', 'var-val');
		expect(subSourceVariables('$${test}\n${test}')).toEqual('${test}\nvar-val');
	});
	it('should replace different variables that are found in multiple places', () => {
		vi.stubEnv('EVIDENCE_VAR__var_a', 'abc');
		vi.stubEnv('EVIDENCE_VAR__var_b', 'def');
		expect(subSourceVariables('|${var_a}|${var_b}|')).toEqual('|abc|def|');
	});
	it('should convert 3 different variables', () => {
		vi.stubEnv('EVIDENCE_VAR__test', 'var-val');
		vi.stubEnv('EVIDENCE_VAR__test2', 'var-val2');
		vi.stubEnv('EVIDENCE_VAR__test3', 'var-val3');
		expect(subSourceVariables('|${test}|${test2}|${test3}|')).toEqual(
			'|var-val|var-val2|var-val3|'
		);
	});
	it('should convert 2 different variables and fail 1', () => {
		vi.stubEnv('EVIDENCE_VAR__test', 'var-val');
		vi.stubEnv('EVIDENCE_VAR__test2', 'var-val2');
		vi.stubEnv('EVIDENCE_VAR__test3', 'var-val3');
		expect(subSourceVariables('${test}\n${testZ}\n${test3}')).toEqual(
			'var-val\n${testZ}\nvar-val3'
		);
	});
});
