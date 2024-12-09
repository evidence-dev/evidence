<script context="module">
	import ChevronToggle from './ChevronToggle.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'UI/ChevronToggle',
		component: ChevronToggle
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
</script>

<Story name="All" let:args>
	<ChevronToggle {...args} />
</Story>
