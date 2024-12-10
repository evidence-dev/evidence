<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Example/Alert',
		component: Alert,
		argTypes: {
			content: { control: 'text' },
			status: {
				options: ['base', 'info', 'negative', 'positive', 'warning']
			},
			sticky: {
				control: 'boolean'
			},
			evidenceInclude: {
				control: 'hidden'
			}
		},
		args: {
			content: 'Hello world!',
			sticky: false
		}
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import Alert from './Alert.svelte';
</script>

<Template let:args>
	<Alert {...args} on:click={args.onClick}>{args.content}</Alert>
</Template>

<Story name="Default" />

<Story name="Info" args={{ status: 'info' }} />

<Story name="Negative" args={{ status: 'negative' }} />

<Story name="All the Variants">
	<Alert status="warning">This is an alert</Alert>
	<Alert status="info">This is an alert</Alert>
	<Alert status="positive">This is an alert</Alert>
	<Alert status="negative">This is an alert</Alert>
	<Alert status="base">This is an alert</Alert>
</Story>
