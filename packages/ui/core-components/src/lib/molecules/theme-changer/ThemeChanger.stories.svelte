<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		component: ThemeChanger,
		argTypes: [],
		title: 'molecules/ThemeChanger'
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import ThemeChanger from './ThemeChanger.svelte';
</script>

<Story name="ThemeChanger">
	<ThemeChanger />
</Story>
