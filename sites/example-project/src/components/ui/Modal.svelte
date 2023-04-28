<script>
	import CloseIcon from '$lib/icons/CloseIcon.svelte';
	export let open = false;
	export let title = '';
	export let innerText = '';
	const isOpen = () => {
		open = !open;
	};
</script>

<button on:click={() => isOpen()} class="border rounded px-4 py-1 text-sm my-3"> Open modal</button>
{#if open}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		on:click={() => isOpen()}
		class="modal z-50 fixed w-full h-full top-0 left-0 flex items-center justify-center lg:p-0"
	>
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
						class="flex items-center justify-center border rounded-full hover:bg-gray-200"
						on:click={() => isOpen()}
					>
						<CloseIcon />
					</button>
				{/if}
				{#if title.trim() == ''}
					<button
						class=" flex items-center justify-center p-0.5 absolute border border-white rounded-full right-0 top-0 hover:bg-gray-200 ml-4"
						on:click={() => isOpen()}
					>
						<CloseIcon />
					</button>
				{/if}
			</div>
			<div
				class="h-auto max-h-96 overflow-y-auto px-10 {title.trim() != ''
					? 'py-4'
					: 'py-6'} text-base break-normal"
			>
				{innerText}
				<slot />
			</div>
		</div>
	</div>
{/if}
