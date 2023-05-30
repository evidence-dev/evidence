<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let customFormattingSettings;
	import { BUILT_IN_FORMATS } from '@evidence-dev/component-utilities/builtInFormats';
	import BuiltInFormatGrid from './BuiltInFormatGrid.svelte';
	import CustomFormatsSection from './CustomFormatsSection.svelte';
	import CollapsibleTableSection from './CollapsibleTableSection.svelte';
	import CurrencyFormatGrid from './CurrencyFormatGrid.svelte';
	import Prism from '../QueryViewerSupport/Prismjs.svelte';

	let exampleQuery = `select 
  growth as growth_pct, -- formatted as a percentage
  sales as sales_usd    -- formatted as US dollars
from table`;
</script>

<form id="formatting">
	<div class="container">
		<div class="panel">
			<h2>Value Formatting</h2>
			<p>
				Format tags like <code>_usd</code> and <code>_pct</code> let you control how data will be formatted
				in Evidence.
			</p>
			<p>Apply format tags by including them at the end of column names. For example:</p>
			<div class="code-container p-2">
				<Prism language="sql" code={exampleQuery} />
			</div>
			<p />
		</div>
		<div class="panel">
			<h2>Built in Format Tags</h2>
			<p>All of the built in format tags are listed below for reference.</p>
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
			<h2>Custom Format Tags</h2>
			<p>
				Add new format tags to your project. Custom format tags use <a
					class="docs-link"
					target="none"
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
				class="docs-link"
				target="none"
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

	.container {
		margin-top: 2em;
		border-top: 1px solid var(--grey-200);
		border-left: 1px solid var(--grey-200);
		border-right: 1px solid var(--grey-200);
		border-radius: 5px 5px 0 0;
		font-size: 14px;
		font-family: var(--ui-font-family);
		min-width: 100%;
	}
	.panel {
		border-top: 1px solid var(--grey-200);
		padding: 0em 1em 1em 1em;
	}

	.panel:first-of-type {
		border-top: none;
	}

	div.code-container {
		background-color: var(--grey-100);
		border: 1px solid var(--grey-200);
		overflow: auto;
		border-radius: 4px;
	}

	/* .format-tag {
    background-color: var(--blue-100);
    border-radius: 4px;
    padding: 2px 4px 2px 4px;
  } */

	footer {
		border: 1px solid var(--grey-200);
		border-radius: 0 0 5px 5px;
		background-color: var(--grey-100);
		padding: 1em;
		display: flex;
		font-size: 14px;
		align-items: center;
		font-family: var(--ui-font-family);
	}

	.docs-link {
		color: var(--blue-600);
		text-decoration: none;
	}

	.docs-link:hover {
		color: var(--blue-800);
	}
</style>
