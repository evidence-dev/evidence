<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/Checkbox',
		argTypes: {
			emptySet: {
				control: 'boolean'
			}
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import Checkbox from './Checkbox.svelte';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	const inputStore = getInputContext();
</script>

<Story name="Base" let:args>
	<Checkbox title="base checkbox" name="base_checkbox" {...args} />
	<p>{$inputStore.base_checkbox}</p>
</Story>
<Story name="Default String + Boolean False" let:args>
	<Checkbox title="string false" defaultValue="false" name="string_false" {...args} />
	<p>{$inputStore.string_false}</p>
	<Checkbox title="boolean false" defaultValue={false} name="boolean_false" {...args} />
	<p>{$inputStore.boolean_false}</p>
</Story>
<Story name="Default String + Boolean True" let:args>
	<Checkbox title="string true" defaultValue="true" name="string_true" {...args} />
	<p>{$inputStore.string_true}</p>
	<Checkbox title="boolean true" defaultValue={true} name="boolean_true" {...args} />
	<p>{$inputStore.boolean_true}</p>
</Story>
