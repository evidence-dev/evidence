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

import { onMount } from 'svelte';
import { get } from 'svelte/store';
// @ts-expect-error
import { page } from '$app/stores';
// @ts-expect-error
import { browser } from '$app/environment';

/**
 * Hydrates a value using a URL search parameter.
 * @param {string} key
 * @param {(value: string | null) => unknown} hydrate
 */
export function hydrateFromUrlParam(key, hydrate) {
	if (browser) {
		// window.location
		// onMount(() => {
		const url = new URL(window.location.href);
		if (url.searchParams.has(key)) {
			hydrate?.(url.searchParams.get(key));
		}
		// });
	}
}

/**
 * Updates the URL search parameter.
 * @param {string} key
 * @param {string | null} value
 */
export function updateUrlParam(key, value) {
	if (browser) {
		const url = new URL(window.location.href);

		if (value) {
			url.searchParams.append(key, value);
		} else {
			url.searchParams.delete(key);
		}

		history.replaceState(null, '', `?${url.searchParams.toString()}`);
		console.log(url.searchParams.toString());
	}
}
