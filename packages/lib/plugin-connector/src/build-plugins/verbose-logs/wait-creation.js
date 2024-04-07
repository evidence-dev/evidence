import fs from 'fs/promises'

/**
 * Waits for the specified directory to be created.
 * @param {string} directoryPath
 * @param {number} maxAttempts
 * @param {number} intervalMs
 * @returns {Promise<void>}
 */
export async function waitForDirectoryCreation(directoryPath, maxAttempts = 30, intervalMs = 3000) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const dirExists = await (await fs.stat(directoryPath)).isDirectory()
      if (dirExists) {
        console.log(`Directory ${directoryPath} exists.`);
        return;
      } else {
        console.log("dir not found")
      }
    } catch (error) {
      console.log("waiting for the dir to be created")
    }
    attempts++;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Directory ${directoryPath} not created within the specified time.`);
}