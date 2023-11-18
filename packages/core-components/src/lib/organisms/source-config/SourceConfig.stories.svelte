<script>
	import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
	import SourceConfig from './SourceConfig.svelte';
	import { postgresOptions } from './fake-options.js';

	let sources = [
		{ name: 'BearDB', type: 'postgres', package: '@evidence-dev/postgres', options: {} },
		{ name: 'BearDB', type: 'postgres', options: {} },
		{ name: 'BearDB', type: 'postgres', options: {} }
	];
	let availableSourcePlugins = {
		postgres: {
			package: {
				package: {
					name: '@evidence-dev/postgresql',
					evidence: { iconUrl: 'https://picsum.photos/200' }
				}
			},
			options: postgresOptions
		}
	};
</script>

<Meta
	title="Organisms/SourceConfig"
	component={SourceConfig}
	args={{ sources, availableSourcePlugins }}
/>

<Template let:args>
	<SourceConfig {...args} />
</Template>

<Story name="Default" />
