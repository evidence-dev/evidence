<script>
	// @ts-check

	import { BUILT_IN_FORMATS } from '@evidence-dev/component-utilities/builtInFormats';
	import BuiltInFormatGrid from './BuiltInFormatGrid.svelte';
	import CustomFormatsSection from './CustomFormatsSection.svelte';
	import CurrencyFormatGrid from './CurrencyFormatGrid.svelte';
	import CodeBlock from '../CodeBlock.svelte';
	import { Accordion, AccordionItem } from '../../../atoms/accordion/index.js';

	/** @type {{ customFormats?: { formatTag: string }[] }}*/
	export let customFormattingSettings;

	let exampleQuery = `select 
  growth as growth_pct, -- formatted as a percentage
  sales as sales_usd    -- formatted as US dollars
from table`;

	let componentExample = `<LineChart
	data={sales_data}
	x=date
	y=sales
	yFmt=euro
/>`;

	let valueExample = `<Value data={sales_data} column=sales fmt='$#,##0' />`;
</script>

<section class="flex flex-col gap-6">
	<div>
		<h3 class="text-base-content text-lg font-semibold mb-2">Using Formats</h3>
		<p class="markdown">In the Value component, you can use the <code>fmt</code> prop</p>
		<CodeBlock source={valueExample} language="svelte" />
		<p class="markdown">In charts, you can use the <code>xFmt</code> and <code>yFmt</code> props</p>
		<CodeBlock source={componentExample} language="svelte" />
		<p class="markdown">
			You can also set formats within your SQL queries using SQL format tags. Use these by aliasing
			your column names and appending a format. For example:
		</p>
		<CodeBlock source={exampleQuery} language="sql" />
	</div>
	<div>
		<h3 class="text-base-content text-lg font-semibold mb-2">Builtin Formats</h3>
		<p>All built-in formats are listed below for reference.</p>
		<Accordion single>
			<AccordionItem title="Dates">
				<BuiltInFormatGrid formats={BUILT_IN_FORMATS.filter((d) => d.formatCategory === 'date')} />
			</AccordionItem>
			<AccordionItem title="Currencies">
				<CurrencyFormatGrid
					formats={BUILT_IN_FORMATS.filter((d) => d.formatCategory === 'currency')}
				/>
			</AccordionItem>
			<AccordionItem title="Numbers">
				<BuiltInFormatGrid
					formats={BUILT_IN_FORMATS.filter((d) => d.formatCategory === 'number')}
				/>
			</AccordionItem>
			<AccordionItem title="Percentages">
				<BuiltInFormatGrid
					formats={BUILT_IN_FORMATS.filter((d) => d.formatCategory === 'percent')}
				/>
			</AccordionItem>
		</Accordion>
	</div>
	<div>
		<h3 class="text-base-content text-lg font-semibold mb-2">Custom Formats</h3>
		<p>
			Add new formats to your project. Custom formats use <a
				class="markdown"
				target="_blank"
				rel="noreferrer"
				href="https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68"
				>excel-style format codes</a
			> and are saved in your project.
		</p>
		<CustomFormatsSection builtInFormats={BUILT_IN_FORMATS} {customFormattingSettings} />
	</div>
</section>
