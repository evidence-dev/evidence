<script context="module">
	export const meta = {
		title: 'Utils/SQLConsole',
		component: SqlConsole
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import SqlConsole from './SqlConsole.svelte';
</script>

<Template let:args>
	<SqlConsole {...args} />
</Template>

<Story name="Default" />
