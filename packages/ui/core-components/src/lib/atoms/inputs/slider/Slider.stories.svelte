<script context="module">
	import WithScopedInputStore from '../../../storybook-helpers/WithScopedInputStore.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/Slider',
		argTypes: {},
		args: {
			title: 'Basic Slider',
			name: 'Basic Slider',
			defaultValue: 0,
			min: 0,
			max: 100,
			step: 1
		},
		decorators: [() => WithScopedInputStore]
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import Slider from './Slider.svelte';
</script>

<Template let:args>
	<div class="inline-flex flex-col">
		<p class="pb-4 truncate text-xs">{args.title}</p>
		<Slider {...args} />
	</div>
</Template>

<Story name="Default" />
<Story
	name="Slider with Steps with default value"
	args={{ title: 'Months', min: 0, max: 36, step: 12, defaultValue: 12 }}
/>
<Story
	name="Hide max and min"
	args={{ title: 'Months', min: 0, max: 36, step: 12, showMaxMin: false }}
/>
<Story
	name="medium size"
	args={{ title: 'Months', min: 0, max: 36, step: 12, showMaxMin: true, size: 'medium' }}
/>
<Story
	name="large size"
	args={{ title: 'Months', min: 0, max: 36, step: 12, showMaxMin: true, size: 'large' }}
/>
