// import { onMount } from "svelte"
// import { get } from "svelte/store"
// // @ts-expect-error
// import { page } from '$app/stores';
// // @ts-expect-error
// import { browser } from '$app/environment';

// /**
//  * @param {string} key
//  * @param {(value: string | null) => unknown} [hydrate]
//  */
// export function useUrlParams(key, hydrate) {
//     if(browser){
//         onMount(() => {
//             /** @type {{url: URL}} */
//             const {url} = get(page)
//             if (url.searchParams.has(key)) {
//                 hydrate?.(url.searchParams.get(key))
//             }
//         })
//         /**
//          * @param {string | null} value
//         */
//        return (value) => {

//            /** @type {{url: URL}} */
//            const {url} = get(page)
//            if(!url.searchParams.has(key) && value){
//                url.searchParams.append(key, value)
//             } else if (value)
//                 url.searchParams.set(key, value)
//                 else
//                 url.searchParams.delete(key)

//             history.replaceState(null, "", `?${url.searchParams.toString()}`);
//         }
//     }
// }
// @ts-expect-error
import { browser } from '$app/environment';

/**
 * Hydrates a value using a URL search parameter.
 * @param {string} key
 * @param {(value: string | number | null) => unknown} hydrate
 */
export function hydrateFromUrlParam(key, hydrate) {
	if (browser) {
		const url = new URL(window.location.href);
		let _value = parseUrlValue(url.searchParams.get(key));
		console.log('hydrateFromUrlParam', key, _value);
		hydrate?.(_value);
	}
}

/** @type {ReturnType<typeof setTimeout>} */
let timeout;
/**
 * Updates the URL search parameter.
 * @param {string} key
 * @param {string | null} value
 */
export function updateUrlParam(key, value, debounceDelay = null) {
	if (browser) {
		const url = new URL(window.location.href);

		const updateUrl = () => {
			if (value !== null) {
				url.searchParams.set(key, encodeUrlValue(value));
			} else {
				url.searchParams.delete(key);
			}

			history.replaceState(null, '', `?${url.searchParams.toString()}`);
		};

		if (debounceDelay !== null) {
			clearTimeout(timeout);
			timeout = setTimeout(updateUrl, debounceDelay);
		} else {
			updateUrl();
		}
	}
}

/**
 * Encodes a value for a URL parameter.
 * @param {any} value
 * @returns {string}
 */
function encodeUrlValue(value) {
	// Convert value to a JSON string
	const jsonString = JSON.stringify(value);

	// Base64 encode it (btoa only works with strings)
	const base64Encoded = btoa(jsonString);

	// Encode for safe URL usage
	return base64Encoded;
}

/**
 * Parses a value retrieved from a URL parameter.
 * @param {string | null} value
 * @returns {any}
 */
function parseUrlValue(value) {
	if (value === null) return null;

	let parsed;

	// Try to decode as Base64 and parse as JSON
	try {
		const base64Decoded = atob(value);
		parsed = JSON.parse(base64Decoded);
		console.log('parsed', parsed);
		// Return the parsed object if it's a valid object or array
		if (typeof parsed === 'object' && parsed !== null) {
			return parsed;
		}
	} catch {
		// If Base64 decoding or JSON parsing fails, simply return the value as is
		console.log('Error decoding or parsing');
	}

	// Return the value as is (it could be a primitive value or non-Base64 string)
	return parsed || value;
}
