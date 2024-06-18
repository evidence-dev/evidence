import fs from 'fs/promises';

/**
 * Checks if a directory exists.
 * @param {string} directoryPath
 * @returns {Promise<boolean>}
 */
async function directoryExists(directoryPath) {
	try {
		const stats = await fs.stat(directoryPath);
		return stats.isDirectory();
	} catch (error) {
		// @ts-ignore
		if (error.code === 'ENOENT') {
			return false;
		}
		throw error;
	}
}

/**
 * Waits for the specified directory to be created.
 * @param {string} directoryPath
 * @param {number} maxAttempts
 * @param {number} intervalMs
 * @returns {Promise<void>}
 */
export async function waitForDirectoryCreation(directoryPath, maxAttempts = 60, intervalMs = 3000) {
	let attempts = 0;
	while (attempts < maxAttempts) {
		const dirExists = await directoryExists(directoryPath);
		if (dirExists) {
			// console.log(`\nMonitoring pages build progress.`);
			return;
		}
		// } else {
		//   console.log('\nDirectory not found, retrying...');
		// }
		attempts++;
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	throw new Error(`\nDirectory ${directoryPath} not created within the specified time.`);
}
