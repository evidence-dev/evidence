<script context="module">
	import WithScopedInputStore from '../../../storybook-helpers/WithScopedInputStore.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/Checkbox',
		argTypes: {},
		args: {
			title: 'Hide Month Zero',
			name: 'Hide Month Zero'
		},
		decorators: [() => WithScopedInputStore]
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import Checkbox from './Checkbox.svelte';
	import Tab from '$lib/unsorted/ui/Tabs/Tab.svelte';
	import Tabs from '$lib/unsorted/ui/Tabs/Tabs.svelte';
</script>

<Template let:args>
	<div class="h-64">
		<Checkbox {...args} />
	</div>
</Template>

<Story name="Default" />
<Story name="WithDefaultFalse" args={{ defaultValue: false }} />
<Story name="WithDefaultTrue" args={{ defaultValue: true }} />
<Story name="Checkbox with tabs">
	<Tabs>
		<Tab label="Tab 1">
			<Checkbox name="checkbox 1" defaultValue={true} title="checkbox 1" />
		</Tab>
		<Tab label="Tab 2">
			<Checkbox name="checkbox 2" defaultValue={false} title="checkbox 2" />
		</Tab>
	</Tabs>
</Story>
