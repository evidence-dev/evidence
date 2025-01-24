<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { X } from '@steeze-ui/tabler-icons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let open = false;
	export let title = '';
	export let buttonText = '';
	export let innerText = '';

	let closing = false;

	const isOpen = () => {
		if (open) {
			closing = true;
			setTimeout(() => {
				closing = false;
				open = false;
				dispatch('close');
			}, 150); // Set duration to slightly shorter than exit animation
		} else {
			open = true;
		}
	};
</script>

<div class="inline-flex w-fit max-w-full flex-col mt-2 mb-4 ml-0 mr-2">
	<button
		on:click={() => isOpen()}
		class="rounded-md shadow-sm overflow-auto h-8 border
		flex-none py-1 font-medium px-3 text-xs truncate
		border-base-300
		hover:bg-base-200 focus:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-base-300 z-0 bg-base-100"
	>
		{buttonText}
	</button>
</div>
{#if open || closing}
	<div
		class="modal z-50 fixed w-full h-full top-0 left-0 flex items-center justify-center lg:p-0 {closing
			? 'modal-exit'
			: 'modal-enter'}"
	>
		<div class="fixed inset-0 bg-base-100/70" />
		<div
			class="border border-base-300 bg-base-100 w-4/5 max-w-lg mx-auto rounded-lg shadow-lg z-50 overflow-y-auto font-ui"
		>
			<div
				class="relative flex justify-between items-start {title.trim() != ''
					? 'pt-3 pb-1 px-5 text-lg font-semibold break-normal text-center'
					: ''}"
			>
				{#if title.trim() != ''}
					{title}
					<button
						class="flex items-center justify-center border-none text-base hover:bg-base-200 mt-1"
						on:click={() => isOpen()}
					>
						<Icon src={X} class="w-4 h-4" />
					</button>
				{/if}
				{#if title.trim() == ''}
					<button
						class="flex items-center justify-center border-none p-0.5 absolute right-0 top-0 ml-4"
						on:click={() => isOpen()}
					>
						<Icon src={X} class="w-4 h-4 mt-2 mr-2 text-base hover:bg-base-200" />
					</button>
				{/if}
			</div>
			<div
				class="h-auto max-h-96 overflow-y-auto px-5 {title.trim() != ''
					? 'my-4'
					: 'my-6'} text-sm break-normal"
			>
				{innerText}
				<slot />
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	dialog::backdrop {
		@apply backdrop-blur-sm bg-base-100/80;
	}

	.modal-enter::backdrop {
		all: unset;
	}

	@keyframes fadeInScale {
		0% {
			opacity: 0;
			transform: scale(0.9);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.modal-enter {
		animation: fadeInScale 0.2s ease-out;
	}

	@keyframes fadeOutScale {
		0% {
			opacity: 1;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(0.95);
		}
	}

	.modal-exit {
		animation: fadeOutScale 0.2s ease-in;
	}
</style>
