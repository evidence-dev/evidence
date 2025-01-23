/**
 * @param {ReqPropsObj} reqPropsObj
 */

export default function checkInputProps(reqPropsObj) {
	if (reqPropsObj === null || typeof reqPropsObj !== 'object') {
		throw Error('reqProps must be a non-null object');
	}

	if (Object.keys(reqPropsObj).length === 0) {
		throw Error('reqProps must not be empty');
	}

	const errors = [];
	for (const [key, value] of Object.entries(reqPropsObj)) {
		if (value === undefined) {
			errors.push(`Missing required prop: "${key}".`);
		}
	}

	if (errors.length > 0) {
		throw new Error(errors.join('\n'));
	}
}
