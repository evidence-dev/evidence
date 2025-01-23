<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/TextInput',
		component: TextInput,
		argTypes: {},
		args: { title: 'Search Enabled Text Input', name: 'textInput' }
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import TextInput from './TextInput.svelte';
	// From layout.js
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	const inputStore = getInputContext();
</script>

<Template let:args>
	<div class="h-64">
		<TextInput {...args} />
		<p class="font-bold text-lg mt-4">Output Attributes</p>
		<dl>
			<dt class="font-bold">$inputStore.textInput</dt>
			<dd class="ml-4">{$inputStore.textInput}</dd>
			<dt class="font-bold">$inputStore.textInput.sql</dt>
			<dd class="ml-4">{$inputStore.textInput?.sql}</dd>
			<dt class="font-bold">$inputStore.textInput?.search?.("column name")</dt>
			<dd class="ml-4">{$inputStore.textInput?.search?.('column name')}</dd>
		</dl>
	</div>
</Template>

<Story name="Default" />
<Story name="Name Error">
	<TextInput name={undefined} />
</Story>
