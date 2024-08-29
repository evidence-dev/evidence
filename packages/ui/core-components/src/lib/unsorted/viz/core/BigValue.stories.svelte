<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Viz/BigValue',
		component: BigValue,
		argTypes: {},
		args: { data: { loading: true }, value: 'someCol' }
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import BigValue from './BigValue.svelte';
</script>

<Template let:args>
	<div class="h-64">
		<BigValue {...args} />
	</div>
</Template>

<Story name="Default" />
