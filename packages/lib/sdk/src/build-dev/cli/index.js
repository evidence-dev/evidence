import { add } from './add.js';
import { build } from './build.js';
import { dev } from './dev.js';
import { upgrade } from './upgrade.js';

/**
 * @type {import("@brianmd/citty").SubCommandsDef}
 */
export const buildDevCli = {
	add,
	build,
	dev,
	upgrade
};
