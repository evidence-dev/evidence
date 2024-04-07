import fs from 'fs';

/**
 * Counts the number of files in a given directory.
 * @param {string} directoryPath
 * @returns {Promise<number>}
 */
export async function countFiles(directoryPath) {
  const files = await fs.promises.readdir(directoryPath);
  // const fileCount = files.filter(file => fs.statSync(path.join(directoryPath, file)).isFile()).length;
  const fileCount = files.length;
  return fileCount;
}