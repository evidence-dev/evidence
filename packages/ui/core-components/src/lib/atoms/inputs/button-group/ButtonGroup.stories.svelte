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
	import { setContext } from 'svelte';
	import { readable } from 'svelte/store';

	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	// From layout.js
	const inputStore = getInputContext();

	setContext('page-ctx', { page: readable({ data: {} }), url: new URL('http://localhost:3000') });

	const data = Query.create(`select * from hashtags`, query);

	let storyIframeURL = '';

	const updateURL = () => {
		storyIframeURL = window.location.href;

		// Try forcing Storybook to recognize the change
		const iframe = document.querySelector('iframe');
		if (iframe) {
			iframe.src = iframe.src; // Force reload
		}
	};

	(function () {
		const pushState = history.pushState;
		const replaceState = history.replaceState;

		history.pushState = function () {
			pushState.apply(history, arguments);
			updateURL();
		};

		history.replaceState = function () {
			replaceState.apply(history, arguments);
			updateURL();
		};

		window.addEventListener('popstate', updateURL);
	})();
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
		data: 'hashtags',
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
		data: 'hashtags',
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
		<ButtonGroup {...args} preset="date" title="Buttons Preset Error" name="tabsStyle" />
	</div>
	<div class="mb-8 mt-4">
		<ButtonGroup
			{...args}
			preset="dates"
			display="tab"
			title="Buttons Display Error"
			name="tabsStyle"
		/>
	</div>
	<div class="mb-8 mt-4">
		<ButtonGroup
			{...args}
			preset={['dates string in array']}
			display={['buttons string in array']}
			title="Buttons non-string Error"
			name="tabsStyle"
		/>
	</div>
</Story>
<Story name="URL Params Hard Coded Entries" let:args>
	<div class="mb-8">
		<ButtonGroup {...args}>
			<ButtonGroupItem valueLabel="Num 1" value={1} />
			<ButtonGroupItem valueLabel="Num 2" value={2} />
			<ButtonGroupItem valueLabel="Num 3" value={3} default />
			<ButtonGroupItem valueLabel="Num 4" value={4} />
			<ButtonGroupItem valueLabel="String 4" value={'4'} />
		</ButtonGroup>
	</div>

	Current Value: {$inputStore[args.name]}
	<div>URL: {storyIframeURL}</div>
	<button
		class="mt-4 p-1 border bg-info/60 hover:bg-info/40 active:bg-info/20 rounded-md text-sm

	"
		on:click={() => window.open(storyIframeURL, '_blank')}>Go to URL</button
	>
</Story>

<Story
	name="URL Params Query-Based Entries - Text"
	let:args
	args={{
		data: 'hashtags',
		value: 'id',
		label: 'tag'
	}}
>
	<div class="mb-8">
		<ButtonGroup {...args} defaultValue={1} />
	</div>

	Current Value: {$inputStore[args.name]}
	<div class="mt-4">URL: {storyIframeURL}</div>
</Story>
<Story
	name="URL params multiple components"
	let:args
	args={{
		data: 'hashtags',
		value: 'id',
		label: 'tag'
	}}
>
	<div class="mb-8">
		<ButtonGroup {...args} defaultValue={1} name="buttonGroup_A" />
	</div>

	Current Value: {$inputStore['buttonGroup_A']}
	<div>URL: {storyIframeURL}</div>
	<button
		class="mt-4 p-1 border bg-info/60 hover:bg-info/40 active:bg-info/20 rounded-md text-sm

	"
		on:click={() => window.open(storyIframeURL, '_blank')}>Go to URL</button
	>

	<div class="mb-8">
		<ButtonGroup {...args} data={undefined} name="buttonGroup_B">
			<ButtonGroupItem valueLabel="Option 1" value={1} default />
			<ButtonGroupItem valueLabel="Option 2" value={2} />
			<ButtonGroupItem valueLabel="Option 3" value={3} />
			<ButtonGroupItem valueLabel="Option 4" value={4} />
		</ButtonGroup>
	</div>

	Current Value: {$inputStore['buttonGroup_B']}
	<div class="mt-4">URL: {storyIframeURL}</div>
	<button
		class="mt-4 p-1 border bg-info/60 hover:bg-info/40 active:bg-info/20 rounded-md text-sm

	"
		on:click={() => window.open(storyIframeURL, '_blank')}>Go to URL</button
	>
</Story>
