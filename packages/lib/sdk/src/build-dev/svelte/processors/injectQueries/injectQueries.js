import { checkImport } from '../../../../lib/check-import.js';
import { getFileMetadata } from '../../metadatas.js';

/** @type {import("svelte/types/compiler/preprocess").PreprocessorGroup} */
export const injectQueries = {
	script: ({ filename, content, attributes }) => {
		if (!filename) return;
		if (attributes.context === 'module') return;
		/** @type {import('../../metadatas.js').FileMetadata} */
		const meta = getFileMetadata(filename) ?? { queries: {} };

		const fileQueries = meta?.queries ?? {};
		const queryNames = Object.keys(fileQueries);
		// There are no queries on this page; so we don't need to do anything.
		if (!queryNames.length) return;

		// TODO: Consider using https://unjs.io/packages/knitwork

		const initialDeclarations = queryNames
			.map((queryName) => `let __evidence_query_text_${queryName} = ''`)
			.join('\n');

		const queryTextAssignments = Object.entries(fileQueries).map(
			([queryName, queryText]) => `__evidence_query_text_${queryName} = \`${queryText}\``
		);

		const queryEffects = queryTextAssignments.map((a) => `$: ${a}`).join('\n');
		const queryMountFn = `onMount(() => {${queryTextAssignments.join(';')}})`;

		// TODO: Do we need to move imports to the top of the file wrt user content?
		const queryDeclarations = `
		${
			checkImport('getQueries', '$evidence/queries', content)
				? ''
				: `import {getQueries} from "$evidence/queries"`
		}
		const queries = getQueries()
		let {${queryNames.map((k) => `${k}: __evidence_query_${k}`).join(',')}} = $queries
		$: ({${queryNames.map((k) => `${k}: __evidence_query_${k}`).join(',')}} = $queries)
		
		${queryNames.map((k) => `let ${k} = $__evidence_query_${k}`).join('\n')}
		${queryNames.map((k) => `$: ${k} = $__evidence_query_${k}`).join('\n')}

		// Layout queries cannot be accessed directly; and must use query.
		// We unwrap these to the value to make sure that proxied values are used
		let query = Object.fromEntries(Object.entries($queries).map(([k,v]) => [k, v.value]))
		$: query = Object.fromEntries(Object.entries($queries).map(([k,v]) => [k, v.value]))
		`;

		const adjusted = `
/******** Preprocessed Code ********/
${
	checkImport('updateQueryContext', '$evidence/updateQueryContext.svelte.js', content)
		? ''
		: `import updateQueryContext from "$evidence/updateQueryContext.svelte.js"`
}
${checkImport('onMount', 'svelte', content) ? '' : `import {onMount} from "svelte"`}
${queryMountFn}
${initialDeclarations}

$: __evidence_page_query_texts = {${queryNames
			.map((queryName) => `${queryName}: __evidence_query_text_${queryName}`)
			.join(', ')}}
	
const updateContext = updateQueryContext()
$: updateContext(__evidence_page_query_texts)
${filename?.endsWith('.md') ? queryDeclarations : ''}

/******** User / Component Code ********/
${content}
			
/******** Preprocessed Code ********/
${queryEffects}
`;
		return { code: adjusted };
	}
};
