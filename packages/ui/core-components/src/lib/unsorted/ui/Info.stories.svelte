<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Ui/Info'
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';

	import Info from './Info.svelte';
</script>

<Story name="Base">
	<h1 class="markdown">
		Metrics
		<Info description="Last 12 months" />
	</h1>
	These metrics come from the World Bank <Info
		description="This metric is a combination of 4 data sources"
	/> and represent 12 months of data.
</Story>
