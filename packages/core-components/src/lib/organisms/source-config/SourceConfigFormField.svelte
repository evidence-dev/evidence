<script>
	import SourceConfigFormSection from './SourceConfigFormSection.svelte';

	export let spec;
	export let key;
	export let options;

	$: title = spec.title ?? key;
	$: optionKey = spec.nest ? `_${key}` : key;
	
</script>

<div>
	<label>
		<p class="mr-2 inline-block">
			{title}
			{#if spec.required}<sup class="text-red-500">*</sup>{/if}
		</p>
		{#if spec.type === 'string'}
			{#if spec.secret}
				<input required={spec.required} type="password" bind:value={options[optionKey]} />
			{:else}
				<input required={spec.required} type="text" bind:value={options[optionKey]} />
			{/if}
		{:else if spec.type === 'boolean'}
			<input required={spec.required} type="checkbox" bind:checked={options[optionKey]} />
		{:else if spec.type === 'number'}
			<input required={spec.required} type="number" bind:value={options[optionKey]} />
		{:else if spec.type === 'select'}
			<select bind:value={options[optionKey]}>
				<option disabled={spec.required} value={undefined} />
				{#each spec.options as option}
					{#if typeof option === 'string'}
						<option value={option}>{option}</option>
					{:else}
						<option value={option.value}>{option.label}</option>
					{/if}
				{/each}
			</select>
		{/if}
	</label>
	{#if spec.description}
		<p class="text-sm italic">
			{spec.description}
		</p>
	{/if}

	{#if spec.children?.[options[optionKey]]}
		<section class="ml-4">
			{#if spec.nest}
				<SourceConfigFormSection
					bind:options={options[key]}
					optionSpec={spec.children[options[optionKey]]}
				/>
			{:else}
				<SourceConfigFormSection bind:options optionSpec={spec.children[options[optionKey]]} />
			{/if}
		</section>
	{/if}
</div>
