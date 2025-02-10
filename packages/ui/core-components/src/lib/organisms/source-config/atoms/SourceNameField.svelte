<script context="module">
	/** @type {boolean} */
	const namePattern = /^[\w_]+$/;

	/**
	 * @param {string} name
	 * @param {{name: string}[]} sources
	 */
	export const validateName = (name, sources) => {
		if (name.length < 1) return 'Source name must be set.';
		if (!namePattern.test(name)) {
			return 'Source names can only contain letters, numbers, and underscores.';
		}
		if (name && sources.some((es) => es.name === name)) {
			return `A source named ${name} already exists.`;
		}
		return '';
	};
</script>

<script>
	import { blur } from 'svelte/transition';
	export let sourceName;
	export let nameError;
	export let showPrefix = false;
</script>

<div class="flex flex-col gap-2">
	<label for="sourceName" class="flex flex-col gap-2">
		<span class="text-sm font-medium">{showPrefix ? 'Directory Name' : 'Name'}</span>
		<div class="flex w-full group focus-within:ring-1 focus-within:ring-base-300 rounded-md">
			{#if showPrefix}
				<div
					class="flex items-center border border-r-0 border-base-300 rounded-l-md px-3 bg-base-100 cursor-text"
				>
					<span class="text-base-content-muted text-sm select-none font-mono">sources/</span>
				</div>
			{/if}
			<input
				required
				name="sourceName"
				class="flex-1 border border-base-300 bg-base-100 shadow-sm text-sm h-9 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
				class:rounded-md={!showPrefix}
				class:rounded-l-none={showPrefix}
				class:rounded-r-md={showPrefix}
				bind:value={sourceName}
				on:change={() => (nameError = '')}
			/>
		</div>
	</label>
	{#if nameError}
		<span class="text-negative text-xs break-words max-w-md" in:blur|local>{nameError}</span>
	{/if}
	{#if showPrefix}
		<p class="text-xs text-base-content-muted">
			Name of the new directory that will be created for this source, under <code class="select-all"
				>`/sources`</code
			>.
		</p>
	{:else}
		<p class="text-xs text-base-content-muted">
			Tables from this source can be queried using <code class="select-all"
				>`&lt;source name&gt;.<wbr />&lt;tablename&gt;`</code
			>. Changing the name will change how you reference the source in your queries, but it will not
			change the source directory.
		</p>
	{/if}
</div>
