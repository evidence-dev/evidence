<script context="module">
	import Badge from './badge.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'UI/Badge',
		component: Badge
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
</script>

<Story name="All variants" let:args>
	<Badge {...args} variant="default">Badge</Badge>
	<Badge {...args} variant="destructive">Badge</Badge>
	<Badge {...args} variant="outline">Badge</Badge>
</Story>
