<script>
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	export let availablePackages;
	let newSourceType = '';
	let newSourceName = '';

	const dispatch = createEventDispatcher();

	function submit() {
		dispatch('newSource', { newSourceType, newSourceName });
		newSourceName = '';
	}
</script>

<div class="col-start-4 w-full flex justify-end items-end flex-col my-4" transition:slide>
	<form class="grid grid-cols-2 gap-4 items-center" on:submit|preventDefault={submit}>
		<p class="w-full text-center col-span-2 font-bold">New Source:</p>

		<label for="sourceType" class="text-right"> Database Type </label>
		<select
			bind:value={newSourceType}
			name="sourceType"
			class="px-2 py-1 border border-gray-500 rounded"
		>
			{#each Object.entries(availablePackages) as [name, value]}
				{@const supports = value.package.package.evidence.databases}
				<optgroup label={name}>
					{#each supports as db}
						{#if Array.isArray(db)}
							<option value={db[0]}>{db[0]}</option>
						{:else}
							<option value={db}>{db}</option>
						{/if}
					{/each}
				</optgroup>
			{/each}
		</select>

		<label for="sourceName" class="text-right"> Source name </label>
		<input
			name="sourceName"
			class="px-2 py-1 border border-gray-500 rounded"
			bind:value={newSourceName}
		/>

		<button
			class="col-start-2 flex bg-green-600 gap-2 mx-1 border border-green-700 text-xs px-2 py-1 text-white font-bold rounded hover:bg-green-700 hover:border-green-800 transition"
		>
			Confirm
		</button>
	</form>
</div>
