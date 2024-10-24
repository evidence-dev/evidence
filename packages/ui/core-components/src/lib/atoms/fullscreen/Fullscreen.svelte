<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { X } from '@steeze-ui/tabler-icons';
	import { Icon } from '@steeze-ui/svelte-icon';

	export let open = false;
	export let search = false;

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
					node.showModal();
					document.body.style.overflow = 'hidden';
				} else {
					node.addEventListener('animationend', () => {
						if (!open) {
							node.close();
						}
					});
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

<dialog
	use:popup={open}
	class="w-[90vw] rounded-lg fixed border border-base-300 text-base-content shadow-lg bg-base-100 {open
		? 'slideIn'
		: 'slideOut'}"
>
	<button
		class="absolute top-4 right-[18.5px] hover:bg-base-200 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-base-300"
		><Icon class="w-6 h-6 " src={X} /></button
	>
	<div class="py-2 px-6 {!search ? 'pt-6' : ''}">
		<slot />
	</div>
</dialog>

<style lang="postcss">
	/* your styles go here */
	dialog::backdrop {
		@apply backdrop-blur-sm bg-base-100/80;
	}

	.slideOut::backdrop {
		all: unset;
	}

	@keyframes slideInFromBottom {
		0% {
			transform: translateY(70%);
			opacity: 0;
		}
		90% {
			opacity: 0.3;
		}
		100% {
			transform: translateY(0%);
			opacity: 0.95;
		}
	}

	.slideIn {
		animation: slideInFromBottom 0.3s ease-in-out;
	}

	@keyframes slideOutToBottom {
		0% {
			transform: translateY(0%);
			opacity: 1;
		}
		100% {
			transform: translateY(40%);
			opacity: 0;
		}
	}

	.slideOut {
		animation: slideOutToBottom 0.3s ease-in-out;
	}
</style>
