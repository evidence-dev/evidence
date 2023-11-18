export const postgresOptions = {
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
			[true]: {
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
			},
			[false]: {}
		}
	},
	schema: {
		title: 'Schema',
		type: 'string',
		secret: false,
		description: 'Default schema'
	}
};
