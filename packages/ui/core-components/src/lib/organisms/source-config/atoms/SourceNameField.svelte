<script context="module">
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
	export let sourceName;
	export let nameError;
</script>

<label for="sourceName" class="flex justify-between w-full">
	Source name
	<input
		required
		name="sourceName"
		class="rounded border border-base-300 bg-base-100 p-1 ml-auto w-2/3 align-middle text-sm"
		bind:value={sourceName}
		on:change={() => (nameError = '')}
	/>
</label>
<div class="flex justify-end w-full">
	{#if nameError}
		<span class="text-negative font-bold text-sm">{nameError}</span>
	{/if}
</div>
