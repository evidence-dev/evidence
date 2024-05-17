<script>
	import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
	import TextInput from './TextInput.svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	// From layout.js
	const inputStore = writable({});
	setContext(INPUTS_CONTEXT_KEY, inputStore);
</script>

<Meta
	title="Atoms/inputs/TextInput"
	component={TextInput}
	argTypes={{}}
	args={{ title: 'Search Enabled Text Input', name: 'textInput' }}
/>

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
