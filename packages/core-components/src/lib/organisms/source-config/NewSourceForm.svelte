<script>
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	export let availablePackages;
	export let ghost = false
	let newSourceType = '';
	let newSourceName = '';

	const dispatch = createEventDispatcher();

	function submit() {
		dispatch('newSource', { newSourceType, newSourceName });
		newSourceName = '';
	}
</script>

<div class="col-span-4 w-full flex justify-end items-end flex-col py-4 px-4 rounded" transition:slide
	class:bg-gray-100={!ghost}
>
	<form class="flex flex-col w-full gap-4" on:submit|preventDefault={submit}>
		<h3 class="text-sm uppercase gray-600 font-bold text-left">Add new source</h3>

		<label for="sourceType" class="flex justify-between w-full">
			Database Type
			<select
				required
				bind:value={newSourceType}
				name="sourceType"
				class="rounded border border-gray-300 p-1 ml-auto w-2/3 text-gray-950 align-middle text-sm"
			>
				{#each Object.entries(availablePackages) as [name, value]}
					{@const supports = value.package.package.evidence.databases}
					<optgroup label={name}>
						{#each supports as db}
							{#if Array.isArray(db)}
								{#if db.length}
									<option value={db[0]}>{db[0]}</option>
								{:else}
									<!-- This is a misconfiguratino of the datasource package -->
								{/if}
							{:else}
								<option value={db}>{db}</option>
							{/if}
						{/each}
					</optgroup>
				{/each}
			</select>
		</label>

		<label for="sourceName" class="flex justify-between w-full">
			Source name
			<input
				required
				pattern="^(\w)+$"
				name="sourceName"
				class="rounded border border-gray-300 p-1 ml-auto w-2/3 text-gray-950 align-middle text-sm"
				bind:value={newSourceName}
			/>
		</label>

		<button
			class="ml-auto flex bg-green-600 gap-2 border border-green-700 text-xs px-2 py-1 text-white font-bold rounded hover:bg-green-700 hover:border-green-800 transition"
		>
			Confirm
		</button>
	</form>
</div>
