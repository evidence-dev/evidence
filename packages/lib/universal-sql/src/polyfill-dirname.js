import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

function getCallerFile(position = 2) {
	if (position >= Error.stackTraceLimit) {
		throw new TypeError(
			'getCallerFile(position) requires position be less then Error.stackTraceLimit but position was: `' +
				position +
				'` and Error.stackTraceLimit was: `' +
				Error.stackTraceLimit +
				'`'
		);
	}

	const oldPrepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (_, stack) => stack;
	const stack = new Error().stack;
	Error.prepareStackTrace = oldPrepareStackTrace;

	if (stack !== null && typeof stack === 'object') {
		// stack[0] holds this file
		// stack[1] holds where this function was called
		// stack[2] holds the file we're interested in
		return stack[position] ? stack[position].getFileName() : undefined;
	}
}
function getFileNameFromUrl(url) {
	return fileURLToPath(url);
}
function getFileName() {
	const url = getCallerFile();
	return getFileNameFromUrl(url);
}
function getDirName() {
	const url = getCallerFile();
	return dirname(getFileNameFromUrl(url));
}

if (!('__dirname' in globalThis))
	Object.defineProperty(globalThis, '__dirname', {
		get: getDirName
	});
if (!('__filename' in globalThis))
	Object.defineProperty(globalThis, '__filename', {
		get: getFileName
	});
