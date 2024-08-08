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
			const scrollY = window.scrollY;
			node.showModal();
			window.scrollTo(0, scrollY);
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

		/** @type {HTMLDialogElement["onkeydown"]} */
		function handleKeyDown(event) {
			if (event.key === 'Escape') {
				open = false;
			}
		}

		node.addEventListener('keydown', handleKeyDown);
		node.addEventListener('click', handleDialogClick);
		const closeButton = node.firstElementChild;
		closeButton.addEventListener('click', handleCloseClick);

		return {
			update(isOpen) {
				if (isOpen) {
					const scrollY = window.scrollY;
					node.showModal();
					window.scrollTo(0, scrollY);
					document.body.style.overflow = 'hidden';
				} else {
					node.close();
					document.body.style.overflow = '';
				}
			},
			destroy() {
				node.removeEventListener('keydown', handleKeyDown);
				node.removeEventListener('click', handleDialogClick);
				closeButton.removeEventListener('click', handleCloseClick);
			}
		};
	}
</script>

<dialog class="w-[90vw] rounded-lg fixed" use:popup={open}>
	<button class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
		><Icon class="w-6 h-6" src={X} /></button
	>
	<div class="py-2 px-6">
		<slot />
	</div>
</dialog>

<style lang="postcss">
	/* your styles go here */
	dialog::backdrop {
		@apply backdrop-blur-sm;
	}
</style>
