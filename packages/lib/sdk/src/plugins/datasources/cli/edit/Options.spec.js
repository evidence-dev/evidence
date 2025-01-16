import { describe, it, expect } from 'vitest';
import {
	Options,
	OptionSpecMode,
	getSecretOptions,
	getSafeOptions,
	OptionParentMode,
	getSpecAtPath
} from './Options.js';

/** @type {import("../../Datasources.js").Datasource["options"]} */
const secSpec = {
	opt: { secret: false, title: 'opt' },
	secret: { secret: true }
};
/** @type {import("../../Datasources.js").Datasource["options"]} */
const secSpecAlt = {
	_opt: { secret: false, title: '_opt' },
	_secret: { secret: true }
};
/** @type {import("../../Datasources.js").Datasource["options"]} */
const secSpecAlt2 = {
	__opt: { secret: false },
	__secret: { secret: true }
};

/** @type {import("../../Datasources.js").Datasource["options"]} */
const testSpec = {
	...secSpec,
	nested: {
		nest: true,
		children: {
			a: secSpec,
			b: secSpecAlt,
			double: {
				v: {
					nest: true,
					children: {
						a: secSpec,
						b: secSpecAlt
					}
				}
			},
			unnested: {
				nest: false,
				children: {
					a: secSpecAlt,
					b: secSpecAlt2
				}
			}
		}
	},
	unnested: {
		nest: false,
		children: {
			a: secSpecAlt,
			b: secSpecAlt2
		}
	}
};

const complexSpec = {
	project_id: {
		title: 'Project ID',
		type: 'string',
		secret: true,
		virtual: false,
		references: '$.keyfile.project_id',
		forceReference: false,
		required: true
	},
	location: {
		title: 'Location (Region)',
		type: 'string',
		secret: false,
		virtual: false,
		forceReference: false,
		required: false,
		default: 'US'
	},
	authenticator: {
		title: 'Authentication Method',
		type: 'select',
		secret: false,
		virtual: false,
		forceReference: false,
		children: {
			'service-account': {
				keyfile: {
					title: 'Credentials File',
					type: 'file',
					secret: false,
					virtual: true,
					forceReference: false,
					fileFormat: 'json',
					required: false
				},
				client_email: {
					title: 'Client Email',
					type: 'string',
					secret: true,
					virtual: false,
					references: '$.keyfile.client_email',
					forceReference: true,
					required: true
				},
				private_key: {
					title: 'Private Key',
					type: 'string',
					secret: true,
					virtual: false,
					references: '$.keyfile.private_key',
					forceReference: true,
					required: true
				}
			},
			'gcloud-cli': {},
			oauth: {
				token: {
					title: 'Token',
					type: 'string',
					secret: true,
					virtual: false,
					forceReference: false,
					required: true
				}
			}
		},
		required: true,
		options: [
			{ value: 'service-account', label: 'Service Account' },
			{ value: 'gcloud-cli', label: 'GCloud CLI' },
			{ value: 'oauth', label: 'OAuth Access Token' }
		],
		nest: false,
		default: 'service-account'
	}
};
const complexOpts = {
	location: 'US',
	authenticator: 'service-account',
	project_id: 'deadbeef-project',
	keyfile: {
		type: 'service_account',
		project_id: 'deadbeef-project',
		private_key_id: 'deadbeef',
		private_key: 'my private key',
		client_email: 'client@email.com',
		client_id: '42',
		auth_uri: 'https://evidence.dev',
		token_uri: 'https://evidence.dev',
		auth_provider_x509_cert_url: 'https://evidence.dev',
		client_x509_cert_url: 'https://evidence.dev'
	},
	client_email: 'https://evidence.dev',
	private_key: 'my private key'
};

describe('Options', () => {
	describe('get', () => {
		describe('root-level', () => {
			it('should get a value', () => {
				const opts = { opt: 'hi', secret: false };

				const options = Options(testSpec, opts);
				expect(options.opt).toBe('hi');
			});
			it.skip('should throw for a non-defined option', () => {
				const opts = { opt: 'hi', secret: false };

				const options = Options(testSpec, opts);
				expect(() => options.notReal).toThrowError();
			});
		});
		describe('children, nested', () => {
			it('should get a value', () => {
				const opts = { _nested: 'a', nested: { opt: 'hi' } };
				const options = Options(testSpec, opts);

				expect(options.nested.opt).toBe('hi');
			});
			it('should allow you to get the value of the field', () => {
				const opts = { _nested: 'a', nested: { opt: 'hi' } };
				const options = Options(testSpec, opts);

				expect(options[OptionParentMode].nested).toBe('a');
			});

			it.skip('should throw for a non-defined option', () => {
				const opts = { _nested: 'a', nested: { opt: 'hi' } };
				const options = Options(testSpec, opts);

				expect(() => options.nested.notReal).toThrowError();
			});
		});
		describe('children, unnested', () => {
			it('should get a child value', () => {
				const opts = { unnested: 'a', _opt: 'hi' };
				const options = Options(testSpec, opts);

				expect(options.unnested._opt).toBe('hi');
			});
			it('should allow you to get the value of the field', () => {
				const opts = { unnested: 'a' };
				const options = Options(testSpec, opts);

				expect(options[OptionParentMode].unnested).toBe('a');
			});

			it.skip('should throw for a non-defined option', () => {
				const opts = { _nested: 'a', nested: { opt: 'hi' } };
				const options = Options(testSpec, opts);

				expect(() => options.nested.notReal).toThrowError();
			});
		});
	});

	describe('set', () => {
		describe('root-level', () => {
			// Set Value
			it('should properly set a base value', () => {
				const opts = { opt: 'hi', secret: false };

				const options = Options(testSpec, opts);
				options.opt = 'bye';
				expect(options.opt).toBe('bye');
			});
			// Set Child Value (nested)
			// Set Child Value (un-nested)
		});
		describe('children, nested', () => {
			it('should properly set a nested child value', () => {
				const opts = { _nested: 'a', nested: { opt: 'hi' } };
				const options = Options(testSpec, opts);
				options.nested.opt = 'bye';

				expect(options.nested.opt).toBe('bye');
			});
			it('should properly set a nested child value when the nested key does not exist', () => {
				const opts = { _nested: 'a' };
				const options = Options(testSpec, opts);
				options.nested.opt = 'bye';

				expect(options.nested.opt).toBe('bye');
			});
			it('should properly set a nested value, when the spec calls for it', () => {
				const opts = { _nested: 'a' };
				const options = Options(testSpec, opts);

				options.nested = 'b';
				options.nested = { _opt: 'bye' };

				expect(options.nested._opt).toBe('bye');
			});
			it('should throw when setting a nested value to an object with invalid keys', () => {
				const opts = { _nested: 'a' };
				const options = Options(testSpec, opts);

				// _opt is in the "b" spec, not the "a" spec
				expect(() => (options.nested = { _opt: 'bye' })).toThrowError();
			});
		});
		describe('children, unnested', () => {
			it('should get a non-nested child value', () => {
				const opts = { unnested: 'a', _opt: 'hi' };
				const options = Options(testSpec, opts);

				options.unnested._opt = 'bye';
				expect(options.unnested._opt).toBe('bye');
			});
		});
		describe('meta functions', () => {
			it('should JSON stringify properly', () => {
				const opts = {};
				const options = Options(testSpec, opts);

				options.nested = 'a';
				options.nested.opt = 'nested.opt';
				options.nested.secret = 'nested.secret';
				options.unnested = 'a';
				options.unnested._opt = 'unnested.opt';
				options.unnested._secret = 'unnested.secret';

				expect(JSON.parse(JSON.stringify(options))).toEqual(JSON.parse(JSON.stringify(opts)));
			});
			it('should return keys from the spec, not the object', () => {
				const opts = { x: 1, y: 2, unnested: 'a', _nested: 'a', nested: { opt: 'hi' } };
				const options = Options(testSpec, opts);

				expect(Object.keys(options)).toEqual(['nested', 'unnested']);
			});
		});
	});

	describe('spec mode', () => {
		it('should return the field spec from a field if in spec mode', () => {
			const opts = {};
			const options = Options(testSpec, opts, { specMode: true });

			expect(options.opt.secret).toBe(false);
			expect(options.secret.secret).toBe(true);
		});
		it('should return the field spec from a field if toggled into spec mode', () => {
			const opts = {};
			const options = Options(testSpec, opts);

			expect(options[OptionSpecMode].opt.secret).toBe(false);
			expect(options[OptionSpecMode].secret.secret).toBe(true);
		});
		it('should return the field spec from a field if in spec mode', () => {
			const opts = { _nested: 'a' };
			const options = Options(testSpec, opts);

			expect(options[OptionSpecMode].nested.opt.secret).toBe(false);
			expect(options[OptionSpecMode].nested.secret.secret).toBe(true);
		});
		it('should return the field spec from a field if toggled into spec mode at the root level', () => {
			const opts = { _nested: 'a' };
			const options = Options(testSpec, opts);

			expect(options[OptionSpecMode].nested.opt.secret).toBe(false);
			expect(options[OptionSpecMode].nested.secret.secret).toBe(true);
		});
		it('should return the field spec for a child field', () => {
			const opts = { _nested: 'a' };
			const options = Options(testSpec, opts);

			expect(options[OptionSpecMode].nested.opt.secret).toBe(false);
		});
		it('should return the field spec from a field if toggled into spec mode at a nested level', () => {
			const opts = { _nested: 'a' };
			const options = Options(testSpec, opts);

			expect(options[OptionSpecMode].nested.opt.secret).toBe(false);
			expect(options[OptionSpecMode].nested.secret.secret).toBe(true);
		});
		it('should return the field spec from a field if toggled into spec mode at an unested level', () => {
			const opts = { unnested: 'a' };
			const options = Options(testSpec, opts);

			expect(options[OptionSpecMode].unnested._opt.secret).toBe(false);
			expect(options[OptionSpecMode].unnested._secret.secret).toBe(true);
		});
	});
});

describe('getSecretOptions', () => {
	it('should return secret values', () => {
		const opts = {};
		const options = Options(testSpec, opts);
		options.secret = 'Hi!';

		const secrets = getSecretOptions(options);
		expect(secrets.secret).toEqual('Hi!');
	});
	it('should not return non-secret values', () => {
		const opts = {};
		const options = Options(testSpec, opts);
		options.opt = 'Hi!';
		const secrets = getSecretOptions(options);
		expect(secrets.opt).toBeUndefined();
	});

	it('should return nested secret values', () => {
		const opts = {};
		const options = Options(testSpec, opts);
		options.nested = 'a';
		options.nested.secret = 'Hi!';
		options.nested.opt = 'Bye!';

		const secrets = getSecretOptions(options);

		expect(secrets.nested.secret).toEqual('Hi!');
		expect(secrets.nested.opt).toBeUndefined();
		expect(secrets._nested).toBeUndefined(); // _nested itself is not a secret value; and does not belong here
		expect(secrets).toEqual({ nested: { secret: 'Hi!' } });
	});

	it('should return non-nested secret values', () => {
		const opts = {};
		const options = Options(testSpec, opts);
		options.unnested = 'a';
		options.unnested._secret = 'Hi!';
		options.unnested._opt = 'Bye!';

		const secrets = getSecretOptions(options);

		expect(secrets._secret).toEqual('Hi!');
		expect(secrets._opt).toBeUndefined();
		expect(secrets.unnested).toBeUndefined();
		expect(secrets).toEqual({ _secret: 'Hi!' });
	});

	it('should ignore virtual fields', () => {
		const options = Options(complexSpec, complexOpts);

		const secrets = getSecretOptions(options);

		expect(secrets).toEqual({
			client_email: 'https://evidence.dev',
			private_key: 'my private key',
			project_id: 'deadbeef-project'
		});
	});
});
describe('getSafeOptions', () => {
	it('should return safe values', () => {
		const opts = {};
		const options = Options(testSpec, opts);
		options.secret = 'Hi!';

		const safes = getSafeOptions(options);
		expect(safes.secret).toBeUndefined();
	});
	it('should not return secret values', () => {
		const opts = {};
		const options = Options(testSpec, opts);
		options.opt = 'Hi!';
		const safes = getSafeOptions(options);
		expect(safes.opt).toEqual('Hi!');
	});

	it('should return nested safe values', () => {
		const opts = {};
		const options = Options(testSpec, opts);
		options.nested = 'a';
		options.nested.secret = 'Hi!';
		options.nested.opt = 'Bye!';

		const safes = getSafeOptions(options);

		expect(safes.nested.secret).toBeUndefined();
		expect(safes.nested.opt).toEqual('Bye!');
		expect(safes._nested).toEqual('a');
		expect(safes).toEqual({ nested: { opt: 'Bye!' }, _nested: 'a' });
	});

	it('should return non-nested safe values', () => {
		const opts = {};
		const options = Options(testSpec, opts);
		options.unnested = 'a';
		options.unnested._secret = 'Hi!';
		options.unnested._opt = 'Bye!';

		const safes = getSafeOptions(options);

		expect(safes._secret).toBeUndefined();
		expect(safes._opt).toEqual('Bye!');
		expect(safes.unnested).toEqual('a');
		expect(safes).toEqual({ _opt: 'Bye!', unnested: 'a' });
	});

	it('should ignore virtual fields', () => {
		const options = Options(complexSpec, complexOpts);

		const safes = getSafeOptions(options);

		expect(safes).toEqual({ authenticator: 'service-account', location: 'US' });
	});
});

describe('getSpecAtPath', () => {
	it('should get a root spec', () => {
		const opts = {};
		const options = Options(testSpec, opts);

		expect(getSpecAtPath(options, ['opt'])).toEqual(secSpec['opt']);
	});
	it('should get a nested spec', () => {
		const opts = { _nested: 'a' };
		const options = Options(testSpec, opts);

		expect(getSpecAtPath(options, ['nested'])).toEqual(testSpec.nested);
	});
	it('should get a nested spec', () => {
		const opts = { _nested: 'a' };
		const options = Options(testSpec, opts);

		expect(getSpecAtPath(options, ['nested', 'opt'])).toEqual(secSpec['opt']);
	});
	it('should get a double nested spec', () => {
		const opts = { _nested: 'double' };
		const options = Options(testSpec, opts);

		options.nested = 'double';

		expect(getSpecAtPath(options, ['nested', 'v'])).toEqual(testSpec.nested.children.double.v);
	});
	it('should get an unnested spec', () => {
		const opts = { unnested: 'a' };
		const options = Options(testSpec, opts);

		expect(getSpecAtPath(options, ['unnested', '_opt'])).toEqual(secSpecAlt['_opt']);
	});
});
