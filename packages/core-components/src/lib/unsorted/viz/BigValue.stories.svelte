<script>
	import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
	import BigValue from './BigValue.svelte';
</script>

<Meta title="Viz/BigValue" component={BigValue} argTypes={{}} args={{data: {loading: true}, value: "someCol"}} />

<Template let:args>
	<div class="h-64">
		<BigValue {...args} />
	</div>
</Template>

<Story name="Default" />
