<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Links/LinkButton'
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';

	import LinkButton from './LinkButton.svelte';
</script>

<Story name="Base">
	<LinkButton url={'https://evidence.dev/'}>Best Website Ever</LinkButton>
</Story>
