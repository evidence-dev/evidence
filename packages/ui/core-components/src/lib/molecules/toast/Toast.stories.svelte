<script context="module">
	import Toast from './Toast.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'UI/Toast',
		component: Toast
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
</script>

<Story name="All variants" let:args>
	<Toast {...args} status="error" title="Title" message="This is the toast message" />
	<Toast {...args} status="warning" title="Title" message="This is the toast message" />
	<Toast {...args} status="success" title="Title" message="This is the toast message" />
	<Toast {...args} status="info" title="Title" message="This is the toast message" />
</Story>
