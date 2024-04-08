<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = { title: 'Demo/Queries' };
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import ReactiveQuery from './ReactiveQuery.demo.svelte';
</script>

<Story name="Reactivity">
	<ReactiveQuery />
</Story>
