<script context="module">
	import WithScopedInputStore from '../../../storybook-helpers/WithScopedInputStore.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/CheckboxInput',
		argTypes: {},
		args: {
			title: 'checkbox',
			name: 'checkboxInput'
		},
		decorators: [() => WithScopedInputStore]
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import CheckboxInput from './CheckboxInput.svelte';
</script>

<Template let:args>
	<div class="h-64">
		<CheckboxInput {...args} />
	</div>
</Template>

<Story name="Default" />
<Story name="WithDefaultFalse" args={{ defaultValue: false }} />
<Story name="WithDefaultTrue" args={{ defaultValue: true }} />
