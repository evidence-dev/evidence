<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/Checkbox',
		argTypes: {},
		args: {
			title: 'Hide Month Zero',
			name: 'hide_month_zero'
		}
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
<Story name="WithDefaultFalse" args={{ defaultValue: false }} />
<Story name="WithDefaultTrue" args={{ defaultValue: true }} />
