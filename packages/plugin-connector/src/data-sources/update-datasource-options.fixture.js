export const postgres = {
	package: {
		package: {
			package: {
				name: "@mock/postgres",
				svelte: "",
				main: "",
				evidence: {
					components: false,
					databases: ['pg', 'postgres'],
					exports: { '.': '' },
					name: '@fake-psql',
					main: 'index.cjs'
				}
			},
			path: ''
		},
		options: {
			host: {
				title: 'Host',
				type: 'string',
				secret: false,
				description: 'Database hostname to connect to',
				default: 'localhost',
				required: true
			},
			port: {
				title: 'Port',
				type: 'number',
				secret: false,
				description: 'Database port to connect to',
				default: 5432,
				required: true
			},
			database: {
				title: 'Database',
				type: 'string',
				secret: false,
				description: 'Database to connect to',
				default: 'postgres',
				required: true
			},
			user: {
				title: 'Username',
				type: 'string',
				secret: true,
				description: 'User to connect as',
				required: true
			},
			password: {
				title: 'Password',
				type: 'string',
				secret: true,
				description: 'Password',
				required: true
			},
			ssl: {
				title: 'Enable SSL',
				type: 'boolean',
				secret: false,
				description: 'Should SSL be used',
				nest: true,
				children: {
					true: {
						sslmode: {
							title: 'SSL Mode',
							type: 'select',
							secret: false,
							options: [
								'allow',
								'prefer',
								'require',
								{ value: 'verify-ca', label: 'Verify CA' },
								{ value: 'verify-full', label: 'Verify Full' }
							]
						}
					}
				}
			},
			schema: {
				title: 'Schema',
				type: 'string',
				secret: false,
				description: 'Default schema'
			}
		},
		factory: () => Promise.resolve(() => Promise.resolve({ columnTypes: [], expectedRowCount: 0,})),
		testConnection: () => Promise.resolve(true)
	},
	opts: {
		name: 'new-source',
		type: 'postgres',
		package: '@fake-psql',
		options: {
			host: 'localhost',
			port: 5432,
			user: 'hi',
			password: 'hi',
			_ssl: true,
			ssl: {
				sslmode: 'require'
			}
		}
	},
};

export const duckdb = {
	package: {
		package: {
			package: {
				evidence: { components: false, databases: ['ddb', 'duckdb'] },
				exports: { '.': '' },
				name: '@fake-duckdb',
				main: 'index.cjs'
			},
			path: ''
		},
		options: {
			filename: {
				title: 'Filename',
				/** @type { "string" } */
				type: 'string',
				secret: false,
				description:
					'DuckDB filename. This is relative to your source directory, not your project directory.',
				default: 'needful_things.duckdb',
				required: true
			}
		}
	},
	opts: {
		name: 'new-source',
		type: 'duckdb',
		package: '@evidence-dev/duckdb',
		options: {
			filename: 'needful_things.duckdb'
		}
	}
};
