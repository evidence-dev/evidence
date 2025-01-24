<script>
	// @ts-check

	import { BUILT_IN_FORMATS } from '@evidence-dev/component-utilities/builtInFormats';
	import BuiltInFormatGrid from './BuiltInFormatGrid.svelte';
	import CustomFormatsSection from './CustomFormatsSection.svelte';
	import CollapsibleTableSection from './CollapsibleTableSection.svelte';
	import CurrencyFormatGrid from './CurrencyFormatGrid.svelte';
	import Prism from '../QueryViewerSupport/Prismjs.svelte';

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

<form id="formatting">
	<div class="formatting-settings-box">
		<div class="panel">
			<h2 class="font-semibold text-lg pt-3 pb-2">Value Formatting</h2>
			<p class="text-sm py-2">
				Evidence supports built-in formats (like <code>usd</code> and <code>pct</code>) and
				Excel-style formats (like <code>$#,##0.0</code>). The easiest way to apply these formats is
				using component props. For example:
			</p>
			<p class="text-sm py-2">In the Value component, you can use the <code>fmt</code> prop</p>
			<div class="code-container p-2">
				<Prism code={valueExample} />
			</div>
			<br />
			<p class="text-sm py-2">
				In charts, you can use the <code>xFmt</code> and <code>yFmt</code> props
			</p>
			<div class="code-container p-2">
				<Prism code={componentExample} />
			</div>
			<br />
			<p class="text-sm py-2">
				You can also set formats within your SQL queries using SQL format tags. Use these by
				aliasing your column names and appending a format. For example:
			</p>
			<div class="code-container p-2">
				<Prism code={exampleQuery} />
			</div>
			<p class="text-sm py-2" />
		</div>
		<div class="panel">
			<h2 class="font-semibold text-lg pt-3 pb-2">Built-in Formats</h2>
			<p class="text-sm py-2">All built-in formats are listed below for reference.</p>
			<CollapsibleTableSection headerText={'Dates'} expanded={false}>
				<BuiltInFormatGrid formats={BUILT_IN_FORMATS.filter((d) => d.formatCategory === 'date')} />
			</CollapsibleTableSection>
			<CollapsibleTableSection headerText={'Currencies'} expanded={false}>
				<CurrencyFormatGrid
					formats={BUILT_IN_FORMATS.filter((d) => d.formatCategory === 'currency')}
				/>
			</CollapsibleTableSection>
			<CollapsibleTableSection headerText={'Numbers'} expanded={false}>
				<BuiltInFormatGrid
					formats={BUILT_IN_FORMATS.filter((d) => d.formatCategory === 'number')}
				/>
			</CollapsibleTableSection>
			<CollapsibleTableSection headerText={'Percentages'} expanded={false}>
				<BuiltInFormatGrid
					formats={BUILT_IN_FORMATS.filter((d) => d.formatCategory === 'percent')}
				/>
			</CollapsibleTableSection>
		</div>
		<div class="panel">
			<h2 class="font-semibold text-lg pt-3 pb-2">Custom Formats</h2>
			<p class="text-sm py-2">
				Add new formats to your project. Custom formats use <a
					class="docs-link"
					target="_blank"
					rel="noreferrer"
					href="https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68"
					>excel-style format codes.</a
				>
			</p>
			<CustomFormatsSection builtInFormats={BUILT_IN_FORMATS} {customFormattingSettings} />
		</div>
	</div>
	<footer>
		<span
			>Learn more about <a
				class="text-primary hover:brightness-110 active:brightness-90 transition"
				target="_blank"
				rel="noreferrer"
				href="https://docs.evidence.dev/core-concepts/formatting/"
			>
				formatting in Evidence &rarr;</a
			></span
		>
	</footer>
</form>

<style>
	form {
		scroll-margin-top: 3.5rem; /* offset for sticky header */
	}

	.formatting-settings-box {
		margin-top: 2em;
		border-top: 1px solid var(--base-300);
		border-left: 1px solid var(--base-300);
		border-right: 1px solid var(--base-300);
		border-radius: 5px 5px 0 0;
		font-size: 14px;
		font-family: var(--ui-font-family);
		min-width: 100%;
	}
	.panel {
		border-top: 1px solid var(--base-300);
		padding: 0em 1em 1em 1em;
	}

	.panel:first-of-type {
		border-top: none;
	}

	div.code-container {
		background-color: var(--base-200);
		border: 1px solid var(--base-300);
		overflow: auto;
		border-radius: 4px;
	}

	footer {
		border: 1px solid var(--base-300);
		border-radius: 0 0 5px 5px;
		background-color: var(--base-200);
		padding: 1em;
		display: flex;
		font-size: 14px;
		align-items: center;
		font-family: var(--ui-font-family);
	}
</style>
