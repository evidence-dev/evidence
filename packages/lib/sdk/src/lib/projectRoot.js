import path from 'path';

let _init = process.cwd();
// If we are in a template, strip that part of the URL out
if (_init.endsWith(path.join('.evidence', 'template'))) {
	_init = _init.substring(0, _init.length - path.join('.evidence', 'template').length);
}

/**
 * @deprecated Use projectRoot from "projectPaths.js" instead
 */
export const projectRoot = _init;
