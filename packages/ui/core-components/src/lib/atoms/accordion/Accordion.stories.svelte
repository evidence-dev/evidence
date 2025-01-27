<script context="module">
	import Accordion from './Accordion.svelte';
	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		component: Accordion,
		argTypes: [],
		title: 'Atoms/Accordion'
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { userEvent, within, expect } from '@storybook/test';
	import { AccordionItem } from './index.js';

	// Play Functions
	const openItem = async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		let itemTwo = await canvas.getByText('Item 2');
		await userEvent.click(itemTwo);
		expect(await canvas.getByText('Content 2')).toBeInTheDocument();
	};

	const testSingle = async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		let itemOne = await canvas.getByText('Item 1');
		let itemTwo = await canvas.getByText('Item 2');
		await userEvent.click(itemOne);
		await userEvent.click(itemTwo, { delay: 300 });
		expect(await canvas.getByText('Content 2')).toBeInTheDocument();
		expect(await canvas.queryByText('Content 1')).not.toBeInTheDocument();
	};
</script>

<Story name="Basic Usage">
	<Accordion>
		<AccordionItem title="Item 1">
			<p>Content 1</p>
		</AccordionItem>
		<AccordionItem title="Item 2">
			<p>Content 2</p>
		</AccordionItem>
	</Accordion>
</Story>

<Story name="Item 2 Opened" play={openItem}>
	<Accordion>
		<AccordionItem title="Item 1">
			<p>Content 1</p>
		</AccordionItem>
		<AccordionItem title="Item 2">
			<p>Content 2</p>
		</AccordionItem>
	</Accordion>
</Story>

<Story name="Single" play={testSingle}>
	<Accordion single>
		<AccordionItem title="Item 1">
			<p>Content 1</p>
		</AccordionItem>
		<AccordionItem title="Item 2">
			<p>Content 2</p>
		</AccordionItem>
		<AccordionItem title="Item 3">
			<p>Content 3</p>
		</AccordionItem>
	</Accordion>
</Story>

<Story name="Custom Classes">
	<Accordion class="rounded-xl bg-base-200 px-4">
		<AccordionItem title="Appendix" class="border-none">
			<p>Content 1</p>
		</AccordionItem>
		<AccordionItem title="Definitions" class="border-none">
			<p>Content 2</p>
		</AccordionItem>
		<AccordionItem title="Downloads" class="border-none">
			<p>Content 3</p>
		</AccordionItem>
	</Accordion>
</Story>
<Story name="Error States: No Title, No Children">
	<h1>No title</h1>
	<Accordion>
		<AccordionItem>
			<p>Content 1</p>
		</AccordionItem>
	</Accordion>
	<h1>No children</h1>
	<Accordion></Accordion>
	<h1>Title no children</h1>
	<Accordion>
		<AccordionItem title="Item 1"></AccordionItem>
	</Accordion>
</Story>
