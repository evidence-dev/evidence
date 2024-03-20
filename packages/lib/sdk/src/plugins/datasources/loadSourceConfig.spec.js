import { resetFs, writeFs } from '../../lib/tests/fs.js';

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import yaml from 'yaml';

import {
	loadConnection,
	loadConnectionOptions,
	loadConnectionEnvironment
} from './loadSourceConfig.js';

afterEach(() => {
	resetFs();
	vi.resetAllMocks();
	vi.unstubAllEnvs();
});

describe('loadConnectionEnvironment', () => {
	it('should load nothing when no variables are given', async () => {
		expect(await loadConnectionEnvironment('source')).toEqual({});
	});
	it('should load nothing when no properly formatted variables are given', async () => {
		vi.stubEnv('EVIDENCE_SOURCE_notsource_SOMEVAR', '10');
		expect(await loadConnectionEnvironment('source')).toEqual({});
	});
	it('should load vars when properly formatted variables are given', async () => {
		vi.stubEnv('EVIDENCE_SOURCE__source__SOMEVAR', '10');
		expect(await loadConnectionEnvironment('source')).toEqual({ SOMEVAR: '10' });
	});
	it('should load vars when properly formatted variables are given (with nesting)', async () => {
		vi.stubEnv('EVIDENCE_SOURCE__source__SOMEVAR', '10');
		vi.stubEnv('EVIDENCE_SOURCE__source__SOMEOBJ__KEY', '10');
		expect(await loadConnectionEnvironment('source')).toEqual({
			SOMEVAR: '10',
			SOMEOBJ: { KEY: '10' }
		});
	});
});
describe('loadSourceOptions', () => {
	beforeEach(() => {
		writeFs(
			{
				sources: {
					noOptions: {},
					options: {
						'connection.options.yaml': 'x: 5'
					},
					invalidB64: {
						'connection.options.yaml': yaml.stringify({ x: btoa('hello world').substring(0, 5) })
					},
					validB64: {
						'connection.options.yaml': yaml.stringify({ x: btoa('hello world') })
					}
				}
			},
			process.cwd()
		);
	});
	it('should return an empty object when given a directory w/o an options.yaml', async () => {
		expect(await loadConnectionOptions('./sources/noOptions')).toEqual({});
	});
	it('should return an object when given a directory w/o an options.yaml', async () => {
		expect(await loadConnectionOptions('./sources/options')).toEqual({ x: 5 });
	});
	it('should throw if an invalid base64 error occurs', async () => {
		expect(loadConnectionOptions('./sources/invalidB64')).rejects.toThrowError(
			'Error parsing connection.options.yaml file'
		);
	});
	it('should return b64 decoded options', async () => {
		expect(await loadConnectionOptions('./sources/validB64')).toEqual({ x: 'hello world' });
	});
});
describe('loadConnection', () => {
	beforeEach(() => {
		writeFs(
			{
				sources: {
					invalidYaml: {
						'connection.yaml': 'text foobar\nnumber: 2'
					},
					malformedConnection: {
						'connection.yaml': yaml.stringify({ NaMe: 'malformed' })
					},
					source1dir: {
						'connection.yaml': yaml.stringify({
							name: 'source1',
							type: 'fake-source',
							options: { x: 1 }
						})
					}
				}
			},
			process.cwd()
		);
	});

	it('should return false when given a directory that does not exist', async () => {
		expect(await loadConnection('fake-dir')).toBe(false);
	});

	it('should throw an error when given a directory with an invalid connection.yaml', async () => {
		expect(loadConnection('./sources/invalidYaml')).rejects.toThrowError(
			'Error parsing connection.yaml file'
		);
	});
	it('should throw an error when given a directory with a malformed connection.yaml', async () => {
		expect(loadConnection('./sources/malformedConnection')).rejects.toThrowError(
			'Unable to load connection.yaml'
		);
	});

	it('should load a valid configuration', async () => {
		const result = await loadConnection('sources/source1dir');
		expect(typeof result).not.toEqual('boolean');
		if (result === false) return; // already failed
		expect(result.name).toEqual('source1');
		expect(result.type).toEqual('fake-source');
	});

	it('should include options from a valid configuration', async () => {
		const result = await loadConnection('sources/source1dir');
		expect(typeof result).not.toEqual('boolean');
		if (result === false) return; // already failed
		expect(result.options.x).toEqual(1);
	});
});
