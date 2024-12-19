<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Links/BigLink'
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';

	import BigLink from './BigLink.svelte';
</script>

<Story name="Base">
	<BigLink href={'https://evidence.dev/'}>Next: Deep Dive on Metrics &rarr;</BigLink>
</Story>
