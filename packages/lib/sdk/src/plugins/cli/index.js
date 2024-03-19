import { install } from './install.js';

/**
 * @type {import("@brianmd/citty").SubCommandsDef}
 */
export const pluginsCli = {
	plugins: {
		meta: { name: 'plugins', description: "Manage your project's Evidence Plugins" },
		subCommands: {
			install
		}
	}
};
