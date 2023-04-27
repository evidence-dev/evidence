<script>
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
		class="modal z-50 fixed w-full h-full top-0 left-0 flex items-center justify-center p-8 lg:p-0"
	>
		<div class="fixed inset-0 bg-gray-900 opacity-50" />
		<div class="bg-white w-4/5 max-w-lg mx-auto rounded-lg shadow-xl z-50 overflow-y-auto font-ui">
			<div
				class="relative flex justify-between items-center {title.trim() != ''
					? ' bg-gray-100 py-4 px-12 text-xl font-bold break-normal'
					: ''}"
			>
				{#if title.trim() != ''}
					{title}
					<button
						class="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full ml-4"
						on:click={() => isOpen()}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							height="20px"
							viewBox="0 0 24 24"
							width="20px"
							fill="#000000"
						>
							<path d="M0 0h24v24H0V0z" fill="none" />
							<path
								d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
							/>
						</svg>
					</button>
				{/if}
				{#if title.trim() == ''}
					<div>
						<button
							class="p-1.5 absolute right-0 bg-gray-200 hover:bg-gray-300 rounded-l ml-4"
							on:click={() => isOpen()}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								height="20px"
								viewBox="0 0 24 24"
								width="20px"
								fill="#000000"
							>
								<path d="M0 0h24v24H0V0z" fill="none" />
								<path
									d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
								/>
							</svg>
						</button>
					</div>
				{/if}
			</div>
			<div class="h-auto max-h-96 overflow-y-auto px-12 py-4 text-base break-normal">
				{innerText}
				<slot />
			</div>
		</div>
	</div>
{/if}
