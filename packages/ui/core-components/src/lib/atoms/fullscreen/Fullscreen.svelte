<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { X } from '@steeze-ui/tabler-icons';
	import { Icon } from '@steeze-ui/svelte-icon';

	export let open = false;

	/** @type {import("svelte/action").Action<HTMLDialogElement, boolean>}*/
	function popup(node, isOpen) {
		if (isOpen) {
			node.showModal();
		} else {
			node.close();
		}

		/** @type {HTMLDialogElement["onclick"]} */
		function handleDialogClick(e) {
			if (e.target === node) {
				open = false;
			}
		}

		/** @type {HTMLDialogElement["onclick"]} */
		function handleCloseClick() {
			open = false;
		}

		node.addEventListener('click', handleDialogClick);
		const closeButton = node.firstElementChild;
		closeButton.addEventListener('click', handleCloseClick);

		return {
			update(isOpen) {
				if (isOpen) {
					node.showModal();
				} else {
					node.close();
				}
			},
			destroy() {
				node.removeEventListener('click', handleDialogClick);
				closeButton.removeEventListener('click', handleCloseClick);
			}
		};
	}
</script>

<dialog class="w-[90vw] rounded-lg relative" use:popup={open}>
	<button class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
		><Icon class="w-6 h-6" src={X} /></button
	>
	<div class="py-2 px-6">
		<slot />
	</div>
</dialog>
