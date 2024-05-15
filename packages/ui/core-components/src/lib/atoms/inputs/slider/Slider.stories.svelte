<script context="module">
	import WithScopedInputStore from '../../../storybook-helpers/WithScopedInputStore.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/Slider',
		argTypes: {},
		args: {
			title: 'Hide Month Zero',
			name: 'Month',
			min: 0,
			max: 36,
			steps: 1
		},
		decorators: [() => WithScopedInputStore]
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import Slider from './Slider.svelte';
	import { minDate } from '@internationalized/date';
</script>

<Template let:args>
	<div class="h-64">
		<Slider {...args} />
	</div>
</Template>

<Story name="Default" />
<Story name="DefaultWithStep" args={{ step: 12 }} />
<Story name="DefaultWithStep" args={{ step: 12 }} />
