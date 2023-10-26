<script>
	import { Meta, Template, Story } from '@storybook/addon-svelte-csf';
	import Skeleton from './Skeleton.svelte';
</script>

<Meta title="Example/Skeleton" component={Skeleton} argTypes={{}} />

<Template let:args>
	<div class="h-64">
		<Skeleton {...args} />
	</div>
</Template>

<Story name="Default" />
