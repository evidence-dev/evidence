<script context="module">
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/inputs/ButtonGroup',
		component: ButtonGroup,
		argTypes: {},
		args: { title: 'Group of buttons', name: 'buttonGroup' }
	};
</script>

<script>
	import { Template, Story } from '@storybook/addon-svelte-csf';
	import ButtonGroup from './ButtonGroup.svelte';
	import ButtonGroupItem from './ButtonGroupItem.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';

	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	// From layout.js
	const inputStore = getInputContext();

	const data = Query.create(`select * from hashtags`, query);
</script>

<Template let:args>
	<div class="h-64">
		<ButtonGroup {...args}>
			<slot />
		</ButtonGroup>
		<p class="font-bold text-lg mt-4">Output Attributes</p>
	</div>
</Template>

<Story name="Hard Coded Entries" let:args>
	<div class="mb-8">
		<ButtonGroup {...args}>
			<ButtonGroupItem valueLabel="Option 1" value={1} />
			<ButtonGroupItem valueLabel="Option 2" value={2} />
			<ButtonGroupItem valueLabel="Option 3" value={3} />
			<ButtonGroupItem valueLabel="Option 4" value={4} />
		</ButtonGroup>
	</div>

	Current Value: {$inputStore[args.name]}
</Story>

<Story name="Large Number of Entries " let:args>
	<div class="mb-8">
		<ButtonGroup {...args}>
			{#each Array.from({ length: 20 }, (_, i) => i) as item}
				<ButtonGroupItem valueLabel={`Option ${item}`} value={item} />
			{/each}
		</ButtonGroup>
	</div>

	Current Value: {$inputStore[args.name]}
</Story>

<Story
	name="Query-Based Entries - Text"
	let:args
	args={{
		data,
		value: 'id',
		label: 'tag'
	}}
>
	<div class="mb-8">
		<ButtonGroup {...args} />
	</div>

	Current Value: {$inputStore[args.name]}
</Story>

<Story
	name="Query-Based Entries - Existing Store"
	let:args
	args={{
		data,
		value: 'id',
		label: 'tag'
	}}
>
	<div class="mb-8">
		<ButtonGroup {...args} />
	</div>

	Current Value: {$inputStore[args.name]}
</Story>

<Story
	name="Mixed Entries - Text"
	let:args
	args={{
		data,
		value: 'id',
		label: 'tag'
	}}
>
	<div class="mb-8">
		<ButtonGroup {...args}>
			<ButtonGroupItem valueLabel="Option 1" value="option_1" />
			<ButtonGroupItem valueLabel="Option 2" value="option_2" />
		</ButtonGroup>
	</div>

	Current Value: {$inputStore[args.name]}
</Story>

<Story
	name="Mixed Entries - Existing Store"
	let:args
	args={{
		data,
		value: 'id',
		label: 'tag'
	}}
>
	<div class="mb-8">
		<ButtonGroup {...args}>
			<ButtonGroupItem valueLabel="Option 1" value="option_1" />
			<ButtonGroupItem valueLabel="Option 2" value="option_2" />
		</ButtonGroup>
	</div>

	Current Value: {$inputStore[args.name]}
</Story>

<Story name="Preset - Date Agg" let:args>
	<div class="mb-8">
		<ButtonGroup {...args} preset="dates" />
	</div>

	Current Value: {$inputStore[args.name]}
</Story>

<Story name="Button Group Styled as Tabs" let:args>
	<div class="mb-8">
		<ButtonGroup {...args} preset="dates" title="Default Button Style" name="defaultStyle" />
	</div>
	Current Value: {$inputStore['defaultStyle']}
	<div class="mb-8 mt-4">
		<ButtonGroup
			{...args}
			preset="dates"
			display="tabs"
			title="Buttons Styled as Tabs"
			name="tabsStyle"
		/>
	</div>
	Current Value: {$inputStore['tabsStyle']}
</Story>

<Story name="Hard Coded Entries with Tab Stylings" let:args>
	<div class="mb-8">
		<ButtonGroup {...args} display="tabs">
			<ButtonGroupItem valueLabel="Option 1" value={1} />
			<ButtonGroupItem valueLabel="Option 2" value={2} />
			<ButtonGroupItem valueLabel="Option 3" value={3} />
			<ButtonGroupItem valueLabel="Option 4" value={4} />
		</ButtonGroup>
	</div>

	Current Value: {$inputStore[args.name]}
</Story>

<Story name="Button Group Styled as Tabs + DefaultValue" let:args>
	<div class="mb-8 mt-4">
		<ButtonGroup
			{...args}
			preset="dates"
			display="tabs"
			title="Buttons Styled as Tabs"
			name="tabsStyle"
			defaultValue="1 month"
		/>
	</div>
	Current Value: {$inputStore['tabsStyle']}

	<div class="mb-8">
		<ButtonGroup {...args} display="tabs" name="tabsStyle2">
			<ButtonGroupItem valueLabel="Option 1" value={1} default />
			<ButtonGroupItem valueLabel="Option 2" value={2} />
			<ButtonGroupItem valueLabel="Option 3" value={3} />
			<ButtonGroupItem valueLabel="Option 4" value={4} />
		</ButtonGroup>
	</div>

	Current Value: {$inputStore['tabsStyle2']}
</Story>

<Story name="Button Group Error States" let:args>
	<div class="mb-8 mt-4">
		<h1>Invalid Preset option</h1>
		<ButtonGroup {...args} preset="date" title="Buttons Preset Error" name="tabsStyle" />
	</div>
	<div class="mb-8 mt-4">
		<h1>Invalid Display option</h1>
		<ButtonGroup
			{...args}
			preset="dates"
			display="tab"
			title="Buttons Display Error"
			name="tabsStyle"
		/>
	</div>
	<div class="mb-8 mt-4">
		<h1>Preset and display contains array of strings</h1>
		<ButtonGroup
			{...args}
			preset={['dates string in array']}
			display={['buttons string in array']}
			title="Buttons non-string Error"
			name="tabsStyle"
		/>
	</div>
	<div class="mb-8">
		<h1>Missing Required Name prop</h1>
		<ButtonGroup {...args} display="tabs" name={undefined}>
			<ButtonGroupItem valueLabel="Option 1" value={1} default />
		</ButtonGroup>
	</div>
	<div class="mb-8">
		<h1>No data, no props, no slot</h1>
		<ButtonGroup />
	</div>
</Story>
<Story name="Button Group Data is string" let:args>
	<div class="mb-8 mt-4">
		<ButtonGroup {...args} data="queryName" title="Data is string" name="dataString" />
	</div>
</Story>
<Story name="Button Group Data but Value not provided" let:args>
	<div class="mb-8 mt-4">
		<ButtonGroup {...args} {data} title="Value missing" name="valueMissing" />
	</div>
</Story>
<Story name="Button Group has slot but no preset" let:args>
	<div class="mb-8 mt-4">
		<ButtonGroup {...args} name="noPreset">
			<ButtonGroupItem valueLabel="Option 1" value={1} default />
		</ButtonGroup>
	</div>
</Story>
