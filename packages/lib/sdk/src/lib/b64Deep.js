/**
 * Encodes a value or an array of values into Base64 recursively.
 * @param {*} v - The value or array of values to encode.
 * @returns {*} - The encoded value or array of values.
 */
export const encodeBase64Deep = (v) => {
	if (Array.isArray(v)) {
		const mapped = v.map(encodeBase64Deep);
		return mapped;
	} else if (typeof v === 'string') {
		return btoa(v);
	} else if (v && v.constructor === Object) {
		// bare object
		return Object.fromEntries(
			Object.entries(v).map(
				/**
				 * Maps each key-value pair of the object.
				 * @param {[string, object]} entry - The key-value pair.
				 * @returns {[string, object|string]} - The encoded key-value pair.
				 */
				([k, v]) => [k, encodeBase64Deep(v)]
			)
		);
	} else {
		return v;
	}
};

/**
 * Dencodes a value or an array of values from Base64 recursively.
 * @param {*} v - The value or array of values to encode.
 * @returns {*} - The encoded value or array of values.
 */
export const decodeBase64Deep = (v) => {
	if (Array.isArray(v)) {
		const mapped = v.map(decodeBase64Deep);
		return mapped;
	} else if (typeof v === 'string') {
		return atob(v);
	} else if (v && v.constructor === Object) {
		// bare object
		return Object.fromEntries(
			Object.entries(v).map(
				/**
				 * Maps each key-value pair of the object.
				 * @param {[string, object]} entry - The key-value pair.
				 * @returns {[string, object|string]} - The encoded key-value pair.
				 */
				([k, v]) => [k, decodeBase64Deep(v)]
			)
		);
	} else {
		return v;
	}
};
