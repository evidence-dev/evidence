import chokidar from 'chokidar';
import { countFiles } from './fileCounter.js';
import { calculateProgress } from './progressCalculator.js';
import { waitForDirectoryCreation } from './wait-creation.js';

/**
 * Watches a directory and calculates the progress of files being added.
 * @param {string} directoryPath
 * @param {number} totalFiles
 * @param {Function} onProgressUpdate
 * @param {Function} onStopCallback
 */
export async function watchDirectory(directoryPath, totalFiles, onProgressUpdate, onStopCallback) {
  await waitForDirectoryCreation(directoryPath);

  const currentFiles = await countFiles(directoryPath);
  const initialProgress = calculateProgress(currentFiles, totalFiles);

  if (initialProgress >= 100) {
    console.log('Progress already at 100% or greater. Exiting watcher.');
    if (typeof onStopCallback === 'function') {
      onStopCallback();
    }
    return;
  }

  const watcher = chokidar.watch(directoryPath, { ignoreInitial: true });

  async function updateProgress() {
    const currentFiles = await countFiles(directoryPath);
    const progress = calculateProgress(currentFiles, totalFiles);
    onProgressUpdate(progress);

    if (progress >= 100) {
      watcher.close();

      if (typeof onStopCallback === 'function') {
        onStopCallback();
      }
    }
  }

  watcher.on('add', updateProgress);
  watcher.on('addDir', updateProgress);
}
