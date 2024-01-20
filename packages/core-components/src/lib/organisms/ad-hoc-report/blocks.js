import { BarChart, LineChart } from '../../unsorted/viz';
import ChartBlock from './chart/ChartBlock.svelte';
import NoteBlock from './note/NoteBlock.svelte';
import QueryBlock from './query/QueryBlock.svelte';
/**
 * @typedef {Object} Chart
 * @property {"chart"} type
 * @property {string} id
 * @property {string} xCol
 * @property {string} yCol
 * @property {"bar" | "line"} chartType
 * @property {string} source
 * @property {string} [sourceName]
 * @property {string} [series]
 * @property {string} [title]
 */

/**
 * @typedef {Object} Note
 * @property {"note"} type
 * @property {string} id
 * @property {string} content
 */

/**
 * @typedef {Object} Query
 * @property {"query"} type
 * @property {string} id
 * @property {string} [title]
 * @property {string} content
 * @property {import("@evidence-dev/query-store").QueryStore} data
 */

/** @typedef {Chart | Note | Query} Block */

/**
 * @type {Record<Chart["chartType"], import("svelte").SvelteComponent>}
 */
export const chartToComponentLookup = {
	bar: BarChart,
	line: LineChart
};

/** @type {Record<Block["type"], import("svelte").SvelteComponent>} */
export const blockEditorComponents = {
	chart: ChartBlock,
	note: NoteBlock,
	query: QueryBlock
};

/**
 * @param {Block[]} blocks
 * @returns {string}
 */
export const serializeBlocks = (blocks) => {
	const safeBlocks = blocks.map((block) => ({ ...block, data: undefined }));
	return JSON.stringify(safeBlocks);
};

const optAttr = (propName, propVal) => (propVal ? `${propName}="${propVal}"` : '');

const chartTypeLookup = {
	bar: 'BarChart',
	line: 'LineChart'
};

const funcs = {
	/**
	 * @param {Query} block
	 */
	query: (block) => `\`\`\`${block.title /* TODO: Sanitize and/or enforce on query title */}
${block.data.originalText}
\`\`\``,
	note: (block) => block.content,
	chart: (block) =>
		`<${chartTypeLookup[block.chartType]} data={${
			block.sourceName ?? '/* Name of the data query here */ []'
		}} x="${block.xCol}" y="${block.yCol}" ${optAttr('series', block.series)} ${optAttr(
			'title',
			block.title
		)}/>`
};

export const blockToMarkdown = (block) => funcs[block.type](block);
