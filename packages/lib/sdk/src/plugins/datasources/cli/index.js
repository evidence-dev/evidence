import { sources } from './sources.js';
import { edit } from './edit.js';

/**
 * @type {import("@brianmd/citty").SubCommandsDef}
 */
export const datasourcesCli = {
	sources,
	connections: {
		meta: {
			name: 'connections',
			description: 'Manage your source connections'
		},
		subCommands: {
			edit
		}
	}
};
