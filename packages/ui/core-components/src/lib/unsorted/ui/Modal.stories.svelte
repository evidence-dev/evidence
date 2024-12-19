<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'ui/Modal'
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';

	import Modal from './Modal.svelte';
</script>

<Story name="Base">
	<Modal buttonText="Click to open modal" title="Title"
		>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
		labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
		laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
		voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
		non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor
		sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
		magna aliqua.</Modal
	>
</Story>
