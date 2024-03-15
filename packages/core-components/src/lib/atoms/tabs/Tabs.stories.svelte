<script context="module">
	/** @type {import("@storybook/svelte").Meta} */

	export const meta = {
		title: 'UI/Tabs',
		component: Tabs
	};
</script>

<script>
	import { Story, Template } from '@storybook/addon-svelte-csf';
	import Tabs from './Tabs.svelte';
	import Tab from './Tab.svelte';
</script>

<Story name="Basic Usage">
	<Tabs>
		<Tab label="First Tab">
			<p>First Tab Content</p>
		</Tab>
		<Tab label="Second Tab">
			<p>Second Tab Content</p>
		</Tab>
		<Tab label="Third Tab">
			<p>Third Tab Content</p>
		</Tab>
	</Tabs>
</Story>

<Story name="Large number of tabs">
	<Tabs>
		<Tab label="Expected Behaviour">
			<p>Tabs overflow with horizontal scroll</p>
		</Tab>
		{#each Array.from({ length: 20 }, (_, i) => i) as i}
			<Tab label={`Tab ${i}`}>
				<p>Tab {i} Content</p>
			</Tab>
		{/each}
	</Tabs>
</Story>

<Story name="Long tab label">
	<Tabs>
		<Tab label="First Tab">
			<p>First Tab Content</p>
		</Tab>
		<Tab label="Second Tab">
			<p>Second Tab Content</p>
		</Tab>
		<Tab
			label="Sunt ipsum exercitation ex esse incididunt veniam non est laborum aliqua. Sunt ipsum exercitation ex esse incididunt veniam non est laborum aliqua. Sunt ipsum exercitation ex esse incididunt veniam non est laborum aliqua. Sunt ipsum exercitation ex esse incididunt veniam non est laborum aliqua."
		>
			<p>Third Tab Content</p>
		</Tab>
	</Tabs>
</Story>

<Story name="Tabs with the same label">
	<Tabs>
		<Tab label="First Tab">
			<p>First Tab Content</p>
		</Tab>
		<Tab label="First Tab">
			<p>Second Tab Content</p>
		</Tab>
		<Tab label="First Tab">
			<p>Third Tab Content</p>
		</Tab>
	</Tabs>
</Story>

<Story name="Well: Basic Usage">
	<Tabs well>
		<Tab label="First Tab">
			<p>First Tab Content</p>
		</Tab>
		<Tab label="Second Tab">
			<p>Second Tab Content</p>
		</Tab>
		<Tab label="Third Tab">
			<p>Third Tab Content</p>
		</Tab>
	</Tabs>
</Story>

<Story name="Well: Large number of tabs">
	<Tabs well>
		<Tab label="Expected Behaviour">
			<p>Tabs overflow with horizontal scroll</p>
		</Tab>
		{#each Array.from({ length: 20 }, (_, i) => i) as i}
			<Tab label={`Tab ${i}`}>
				<p>Tab {i} Content</p>
			</Tab>
		{/each}
	</Tabs>
</Story>

<Story name="Well: Long tab label">
	<Tabs well>
		<Tab label="First Tab">
			<p>First Tab Content</p>
		</Tab>
		<Tab label="Second Tab">
			<p>Second Tab Content</p>
		</Tab>
		<Tab
			label="Sunt ipsum exercitation ex esse incididunt veniam non est laborum aliqua. Sunt ipsum exercitation ex esse incididunt veniam non est laborum aliqua. Sunt ipsum exercitation ex esse incididunt veniam non est laborum aliqua. Sunt ipsum exercitation ex esse incididunt veniam non est laborum aliqua."
		>
			<p>Second Tab Content</p>
		</Tab>
	</Tabs>
</Story>
