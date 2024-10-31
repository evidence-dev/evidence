<script context="module">
	export const evidenceInclude = true;

	// Modified version of https://github.com/romkor/svelte-portal/blob/master/src/Portal.svelte
	import { tick } from 'svelte';

	/**
	 * Usage: <div use:portal={'css selector'}> or <div use:portal={document.body}>
	 *
	 * @param {HTMLElement} el
	 * @param {{target: HTMLElement|string, prepend: boolean}}
	 */
	export function portal(el, { target = 'body', prepend = false }) {
		let targetEl;
		/**
		 * This is used to mark the original place of the content in the document.
		 * If target is set to null after being set to something else (e.g. target is originally "body", then null)
		 * This is used to return the element back to it's place without needing to track siblings
		 * @type {HTMLDivElement}
		 */
		const placeholder = document.createElement('div');
		placeholder.style.display = 'none';
		placeholder.style.position = 'absolute';
		el.parentElement.insertBefore(placeholder, el);

		/**
		 * @param args {{target: HTMLElement|string, prepend: boolean}}
		 */
		const update = async (args) => {
			const { target: newTarget } = args ?? { target: null };
			target = newTarget;

			if (typeof target === 'string') {
				// Handle selector case
				targetEl = document.querySelector(target);
				if (targetEl === null) {
					await tick();
					targetEl = document.querySelector(target);
				}
				if (targetEl === null) {
					throw new Error(`No element found matching css selector: "${target}"`);
				}
			} else if (target instanceof HTMLElement) {
				// Handle Element Ref Case
				targetEl = target;
			} else if (target === null) {
				// Handle null case (e.g. disable portal functionality)
				placeholder.parentElement.insertBefore(el, placeholder);
				el.hidden = false;
				return;
			} else {
				// Unknown case
				throw new TypeError(
					`Unknown portal target type: ${
						target === null ? 'null' : typeof target
					}. Allowed types: string (CSS selector) or HTMLElement.`
				);
			}
			if (prepend) {
				targetEl.prepend(el);
			} else {
				targetEl.appendChild(el);
			}
			el.hidden = false;
		};

		function destroy() {
			if (el.parentNode) {
				el.parentNode.removeChild(el);
			}
		}

		update({ target });
		return {
			update,
			destroy
		};
	}
</script>

<script>
	/**
	 * DOM Element or CSS Selector
	 * @type { HTMLElement|string}
	 */
	export let target = 'body';
</script>

<div use:portal={{ target }} hidden>
	<slot />
</div>
