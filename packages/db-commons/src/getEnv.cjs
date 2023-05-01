/**
 * @param {string[]} key
 * @param {any} envMap
 */
const getEnv = (envMap, ...key) => {
	const keyArray = [...key];

	let t = envMap;
	while (keyArray.length) {
		t = t[keyArray.shift()];
		if (Array.isArray(t) && keyArray.length) {
			// We're too soon
			throw new Error(`Could not find ${key} in env map!`);
		}
	}
	if (Array.isArray(t)) {
		// We have run through the entire key and landed on an array
		for (const k of t) {
			if (process.env[k.key]) {
				if (k.deprecated)
					console.warn(
						`Found environment variable ${k.key}. It is being used but is currently deprecated.`
					);
				return process.env[k.key];
			}
		}
	} else {
		throw new Error(`Could not find ${key} in env map!`);
	}
};

exports.getEnv = getEnv;
