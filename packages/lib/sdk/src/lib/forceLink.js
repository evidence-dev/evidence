import fs from 'fs/promises';
import { EvidenceError } from './EvidenceError.js';

/**
 *
 * @param {string} from
 * @param {string} to
 * @returns {Promise<void>}
 */
export const forceLink = async (from, to) => {
	/** @type {import("fs").Stats | false} */
	const toStat = await fs.stat(to).catch(() => false);
	/** @type {import("fs").Stats | false} */
	const fromStat = await fs.stat(from).catch(() => false);
	if (!fromStat) {
		throw new EvidenceError(`Failed to create symlink, ${from} does not exist`);
	}
	if (toStat) {
		if (toStat.isDirectory()) {
			await fs.rm(to, { recursive: true, force: true });
		} else if (toStat.isSymbolicLink()) {
			await fs.unlink(to);
		} else {
			throw new EvidenceError(`Failed to create symlink ${to} is not a link or a directory`);
		}
	}
	await fs.symlink(from, to, 'dir');
};
