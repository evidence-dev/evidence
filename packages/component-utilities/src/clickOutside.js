// Copied from https://github.com/svelteuidev/svelteui/blob/main/packages/svelteui-composables/src/actions/use-click-outside/use-click-outside.ts
/** @type {import("svelte/action").Action<HTMLElement, { enabled?: boolean, callback?: (node: HTMLElement) => void }>} */
export default function clickoutside(node, params = {}) {
	const { enabled: initialEnabled, callback = () => {} } = params;

    /** @type {EventListener} */
	const handleOutsideClick = ({ target }) => {
		if (!node.contains(target)) callback(node);
	};

    /** @type {(props: { enabled?: boolean }) => void} */
	function update({ enabled }) {
		if (enabled) {
			window.addEventListener('click', handleOutsideClick);
		} else {
			window.removeEventListener('click', handleOutsideClick);
		}
	}
	update({ enabled: initialEnabled });
	return {
		update,
		destroy() {
			window.removeEventListener('click', handleOutsideClick);
		}
	};
}
