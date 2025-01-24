<script context="module">
	import Embed from './Embed.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'UI/Embed',
		component: Embed
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
</script>

<Story name="All">
	<Embed url="https://www.youtube.com/embed/GBWvftt8G80?si=OskePXooCKmRE4nZ" />
</Story>
