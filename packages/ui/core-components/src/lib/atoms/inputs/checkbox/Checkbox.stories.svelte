<script context="module">
	import WithScopedInputStore from '../../../storybook-helpers/WithScopedInputStore.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/Checkbox',
		argTypes: {},
		args: {
			title: 'Hide Month Zero',
			name: 'Hide Month Zero'
		},
		decorators: [() => WithScopedInputStore]
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import Checkbox from './Checkbox.svelte';
</script>

<Template let:args>
	<div class="h-64">
		<Checkbox {...args} />
	</div>
</Template>

<Story name="Default" />
<Story name="WithDefaultFalse" args={{ defaultValue: true }} />
<Story name="WithDefaultTrue" args={{ defaultValue: true }} />
