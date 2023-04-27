<script>
	export let accordionItems = undefined;
	export let firstOpen = false;

	let openIndex = firstOpen ? 0 : -1;

	function toggleAccordion(index) {
		openIndex = index === openIndex ? -1 : index;
	}
</script>

<div class="my-8 divide-y rounded-md border border-neutral-200 min-w-full">
	<!-- Iterate over accordionItems -->
	{#each accordionItems as item, index}
		<div class="accordion-item">
			<h2 class="font-ui font-bold text-lg">
				<button
					on:click={() => toggleAccordion(index)}
					class="flex justify-between items-center w-full px-4 py-2 bg-white border-none cursor-pointer transition-colors duration-300 hover:bg-gray-100 focus:outline-none"
				>
					<span>{item.title}</span>
					<span class="transform {index === openIndex ? 'rotate-180' : ''}">
						<svg
							viewBox="0 0 20 20"
							style="height: 20px; width:20px"
							class="stroke-current"
							fill="none"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M19.5 8.25l-7.5 7.5-7.5-7.5"
							/>
						</svg>
					</span>
				</button>
			</h2>
			<div
				class="text-base overflow-hidden transition-all duration-300 max-h-0 {index === openIndex
					? 'max-h-80'
					: ''}"
			>
				<div class="p-5">
					<p>{item.content}</p>
				</div>
			</div>
		</div>
	{/each}
</div>
