<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'organisms/Header',
		component: Header,
		argTypes: {}
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import Header from './Header.svelte';
</script>

<Story name="Header" id="header">
	<Header />
</Story>
