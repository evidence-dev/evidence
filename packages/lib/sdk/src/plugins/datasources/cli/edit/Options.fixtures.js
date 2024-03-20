export const bigQuerySchema = {
	project_id: {
		title: 'Project ID',
		type: 'string',
		secret: true,
		required: true,
		references: '$.keyfile.project_id',
		forceReference: false
	},
	authenticator: {
		title: 'Authentication Method',
		type: 'select',
		secret: false,
		nest: false,
		required: true,
		default: 'service-account',
		options: [
			{
				value: 'service-account',
				label: 'Service Account'
			},
			{
				value: 'gcloud-cli',
				label: 'GCloud CLI'
			},
			{
				value: 'oauth',
				label: 'OAuth Access Token'
			}
		],
		children: {
			'service-account': {
				keyfile: {
					title: 'Credentials File',
					type: 'file',
					fileFormat: 'json',
					virtual: true
				},
				client_email: {
					title: 'Client Email',
					type: 'string',
					secret: true,
					required: true,
					references: '$.keyfile.client_email',
					forceReference: true
				},
				private_key: {
					title: 'Private Key',
					type: 'string',
					secret: true,
					required: true,
					references: '$.keyfile.private_key',
					forceReference: true
				}
			},
			'gcloud-cli': {
				/* no-op; only needs projectId */
			},
			oauth: {
				token: {
					type: 'string',
					title: 'Token',
					secret: true,
					required: true
				}
			}
		}
	}
};
