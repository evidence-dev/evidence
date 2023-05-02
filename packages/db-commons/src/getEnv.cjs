/**
 * @param {string[]} keyPath
 * @param {any} envMap
 */
const getEnv = (envMap, ...keyPath) => {
	const keyPathParts = [...keyPath];

	let location = envMap;
	while (keyPathParts.length) {
		location = location[keyPathParts.shift()];
		if (Array.isArray(location) && keyPathParts.length) {
			// We're too soon
			throw new Error(`Could not find ${keyPath} in env map!`);
		}
	}
	if (Array.isArray(location)) {
		// We have run through the entire key and landed on an array
		for (const { key, deprecated } of location) {
			if (process.env[key]) {
				if (deprecated)
					console.warn(
						`Found environment variable ${key}. It is being used but is currently deprecated.`
					);
				return process.env[key];
			}
		}
	} else {
		throw new Error(`Could not find ${keyPath} in env map!`);
	}
};

exports.getEnv = getEnv;
