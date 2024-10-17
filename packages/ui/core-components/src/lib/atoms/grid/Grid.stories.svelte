<script context="module">
	/** @type {import("@storybook/svelte").Meta} */
	export const meta = {
		title: 'layout/Grid',
		component: Grid,
		argTypes: {
			cols: {
				type: 'string',
				control: 'select',
				options: [1, 2, 3, 4, 5, 6],
				defaultValue: 2
			},
			gapSize: {
				type: 'string',
				control: 'select',
				options: ['none', 'sm', 'md', 'lg'],
				defaultValue: 'md'
			}
		}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import Grid from './Grid.svelte';
</script>

<Story name="Basic Usage" let:args>
	<Grid {...args}>
		<div class="h-16 bg-base-300" />
		<div class="h-16 bg-base-300" />
		<div class="h-16 bg-base-300" />
		<div class="h-16 bg-base-300" />
		<div class="h-16 bg-base-300" />
		<div class="h-16 bg-base-300" />
	</Grid>
</Story>
