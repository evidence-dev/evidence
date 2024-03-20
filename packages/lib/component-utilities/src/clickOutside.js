// Copied from https://github.com/svelteuidev/svelteui/blob/main/packages/svelteui-composables/src/actions/use-click-outside/use-click-outside.ts
export default function clickoutside(node, params) {
	const { enabled: initialEnabled, callback } = params;

	const handleOutsideClick = ({ target }) => {
		if (!node.contains(target)) callback(node);
	};

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
