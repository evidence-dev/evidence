import { sources } from './sources.js';
import { sourcesStrict } from './sources:strict.js';
import { edit } from './edit.js';

/**
 * @type {import("@brianmd/citty").SubCommandsDef}
 */
export const datasourcesCli = {
	sources,
	sourcesStrict,
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
