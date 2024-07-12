import { runMain } from '@brianmd/citty';
import { rootCli } from './cli.root.js';

/**
 * This function is provided to create a compatibility layer between the legacy Evidence CLI and the new SDK CLI
 * @returns {Promise<void>}
 */
export const cli = () => runMain(rootCli);
