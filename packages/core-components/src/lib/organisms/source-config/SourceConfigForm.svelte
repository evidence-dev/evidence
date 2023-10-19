<script>
	import SourceConfigFormSection from './SourceConfigFormSection.svelte';
	export let sourcePlugin;
	export let source;

	const onSubmit = () => {};
</script>

<form on:submit|preventDefault={onSubmit} class="w-full bg-gray-100 px-4 py-2">
	<h3 class="text-sm uppercase gray-600 font-bold">Configure {source.name}</h3>
	<section class="flex flex-col gap-2">
		<label>
			Source Name
			<input bind:value={source.name} />
		</label>
		<hr />
		<pre>{JSON.stringify(source, null, 2)}</pre>
		<SourceConfigFormSection bind:options={source.options} optionSpec={sourcePlugin.options} />
	</section>
	<button on:submit|preventDefault|stopPropagation={() => {}}>Save</button>
</form>
