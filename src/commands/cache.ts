
import {
  window,
} from 'vscode';

import { deleteFolder } from '../utils/fsUtils';
import { telemetryService } from '../extension';

/**
 * Evidence application cache directories.
 */
const cachePath = '.evidence/template/.evidence-queries';

/**
 * Deletes Evidence application cache directory.
 */
export async function clearCache() {
  if (await deleteFolder(cachePath)) {
    window.showInformationMessage('Cache cleared.');
  }
  else {
    window.showInformationMessage('Cache is already empty.');
  }
  telemetryService?.sendEvent('clearCache');
}
