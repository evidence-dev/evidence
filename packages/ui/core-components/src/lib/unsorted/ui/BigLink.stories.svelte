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
	<BigLink link={'https://evidence.dev/'}>Best Website Ever</BigLink>
</Story>
