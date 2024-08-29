<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Example/Alert',
		component: Alert,
		argTypes: {
			content: { control: 'text' },
			status: {
				options: ['default', 'info', 'danger', 'success', 'warning'],
				control: {
					labels: {
						default: 'Default',
						info: 'Info',
						danger: 'Danger',
						success: 'Success',
						warning: 'Warning'
					}
				}
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

<Story name="Danger" args={{ status: 'danger' }} />

<Story name="All the Variants">
	<Alert status="warning">This is an alert</Alert>
	<Alert status="info">This is an alert</Alert>
	<Alert status="success">This is an alert</Alert>
	<Alert status="danger">This is an alert</Alert>
	<Alert status="default">This is an alert</Alert>
</Story>
