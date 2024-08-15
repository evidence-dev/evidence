<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Example/Skeleton',
		component: Skeleton,
		argTypes: {}
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import Skeleton from './Skeleton.svelte';
</script>

<Template let:args>
	<div class="h-64">
		<Skeleton {...args} />
	</div>
</Template>

<Story name="Default" />
