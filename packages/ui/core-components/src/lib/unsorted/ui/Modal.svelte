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
	const isOpen = () => {
		open = !open;
		if (!open) dispatch('close');
	};
</script>

<button
	on:click={() => isOpen()}
	class="font-ui font-normal text-base no-underline border my-2 rounded-lg py-2 px-3 inline-block transition hover:ease-in hover:border-blue-200 hover:bg-blue-100 hover:no-underline hover:text-gray-800 focus:text-gray-900 focus:border-blue-200"
>
	{buttonText}
</button>
{#if open}
	<div class="modal z-50 fixed w-full h-full top-0 left-0 flex items-center justify-center lg:p-0">
		<div class="fixed inset-0 bg-gray-900 opacity-50" />
		<div class="bg-white w-4/5 max-w-lg mx-auto rounded-lg shadow-xl z-50 overflow-y-auto font-ui">
			<div
				class="relative flex justify-between items-center {title.trim() != ''
					? ' bg-gray-100 py-4 px-10 text-xl font-bold break-normal text-center'
					: ''}"
			>
				{#if title.trim() != ''}
					{title}
					<button
						class="flex items-center justify-center border-none hover:bg-gray-200"
						on:click={() => isOpen()}
					>
						<Icon src={X} class="text-gray-600 w-6 h-6" />
					</button>
				{/if}
				{#if title.trim() == ''}
					<button
						class=" flex items-center justify-center border-none p-0.5 absolute right-0 top-0 ml-4"
						on:click={() => isOpen()}
					>
						<Icon src={X} class="text-gray-600 w-6 h-6 mt-2 mr-2 hover:bg-gray-200" />
					</button>
				{/if}
			</div>
			<div
				class="h-auto max-h-96 overflow-y-auto px-10 {title.trim() != ''
					? 'my-4'
					: 'my-6'} text-base break-normal"
			>
				{innerText}
				<slot />
			</div>
		</div>
	</div>
{/if}
