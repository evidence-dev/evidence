<script context="module">
	import Link from './Link.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'UI/Link',
		component: Link
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
</script>

<Story name="All">
	<Link url="https://www.youtube.com/watch?v=GBWvftt8G80&t=15s" newTab="true" />
</Story>
