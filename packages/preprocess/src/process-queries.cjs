const { getRouteHash } = require('./utils/get-route-hash.cjs');
const { extractQueries } = require('./extract-queries/extract-queries.cjs');
const { highlighter } = require('./utils/highlighter.cjs');
const { containsFrontmatter } = require('./frontmatter/frontmatter.regex.cjs');

// prettier obliterates the formatting of queryDeclarations
// prettier-ignore
const createDefaultProps = function (filename, componentDevelopmentMode, duckdbQueries = {}) {
	const routeH = getRouteHash(filename);

	let queryDeclarations = '';

	if (Object.keys(duckdbQueries).length > 0) {
		const IS_VALID_QUERY = /^([a-zA-Z_$][a-zA-Z0-9d_$]*)$/;
		const valid_ids = Object.keys(duckdbQueries).filter((query) => IS_VALID_QUERY.test(query));

		// prerendered queries: stuff without ${}
		// reactive queries: stuff with ${}
		const IS_REACTIVE_QUERY = /\${.*?}/s;
		const reactive_ids = valid_ids.filter((id) => IS_REACTIVE_QUERY.test(duckdbQueries[id]));
		const prerendered_ids = valid_ids.filter((id) => !IS_REACTIVE_QUERY.test(duckdbQueries[id]));

		// input queries: reactive with ${inputs...} in it
		const IS_INPUT_QUERY = /\${\s*inputs\s*\..*?}/s;
		const input_ids = reactive_ids.filter((id) => IS_INPUT_QUERY.test(duckdbQueries[id]));

		const prerendered_query_stores = prerendered_ids.map((id) => {
			/*
				explanation of _initialData_${id}:
					prerenderable queries should be server side rendered and only server side rendered
					they're cached so they don't need to be rerun on the client
					but, if we're in dev mode, we want to rerun the query on the client, because SSR is not
					guaranteed to have run

				_query_string_${id} is reactive so that it's initialized after user variables (svelte compiler hoists to 'bottom' of script tag)
				it won't ever actually change (it's a static string)

				_${id} is reactive for the same reason as above
			*/
			return `
				$: _query_string_${id} = \`${duckdbQueries[id].replaceAll('`', '\\`')}\`;
				$: _initialData_${id} = (!browser || dev)? queryFunc(_query_string_${id}, '${id}') : data.${id} ?? [];
				$: _${id} = new QueryStore(_query_string_${id}, queryFunc, '${id}', { initialData: _initialData_${id} });
			`;
		});

		const reactive_query_stores = reactive_ids.map((id) => {
			const query = duckdbQueries[id].replaceAll('`', '\\`');
			/*
				"What the heck is happening here":
					_${id}_initial_query:
						Copy of the query as it is written in the source markdown file
						It is interpolated with the initial values of any variables _at mount time_
						and does not change after that

						This variable _must_ be declared; then assigned "reactively" to make sure it can reference the user's variables,
						as it pushes the reactive assignment to the bottom of the file (after the user's scripts have run)
						
						We use the if to make sure it is only reactive once, and still acts as a "constant"


					_${id}_current_query:
						Copy of the query with the variables reactively interpolated - this is what will
						actually be executed against the database

						
					_${id}_changed:
						Helper variable to check if current is same as initial

					
					We care about all of this because we want to provide the initialData from SSR when the query is unchanged,
					but we need to ensure that if the query changes, it re-executes. When constructing the QueryStore below,
					we hinge on the change to pass intiailData (or not).
			*/
			return `
				// Initial Query
				let _${id}_initial_query;
				$: if(!_${id}_initial_query) _${id}_initial_query = \`${query}\`;
				onMount(() => _${id}_initial_query = \`${query}\`);
		
				// Current Query
				$: _${id}_current_query = \`${query}\`;
				
				// Query has changed
				$: _${id}_changed = browser ? _${id}_current_query !== _${id}_initial_query : false;
				
				// Actual Query Execution
				$: _${id} = new QueryStore(
					\`${query}\`,
					queryFunc,
					'${id}',
					{
						initialData: _${id}_changed 
							// Query has changed, do not provide intiial data
							? undefined 
							// Query has not changed, provide initial data
							: data.${id} ?? queryFunc(\`${query}\`, '${id}')
					}
				);
			`;
		});

		/* 
			reactivity doesn't happen on the server, so we need to manually subscribe to the inputs store
			and update the queries when the inputs change
		*/
		const input_query_stores = `
		if (!browser) {
			onDestroy(inputs_store.subscribe((inputs) => {
				${input_ids.map((id) => `
					_${id} = new QueryStore(
						\`${duckdbQueries[id].replaceAll('`', '\\`')}\`,
						queryFunc,
						'${id}',
						{ initialData: queryFunc(\`${query}\`, '${id}') }
					);
				`).join('\n')}
			}));
		}
		`;

		queryDeclarations += `
			import { browser, dev } from "$app/environment";
			import { profile } from '@evidence-dev/component-utilities/profile';
			import debounce from 'debounce';
			import { QueryStore } from '@evidence-dev/query-store';
			
			const queryFunc = (query, id) => profile(__db.query, query, { query_name: id });

			${prerendered_query_stores.join('\n')}
			${reactive_query_stores.join('\n')}
			${input_query_stores}
		`;
	}

	let defaultProps = `
        import { page } from '$app/stores';
        import { pageHasQueries, routeHash } from '@evidence-dev/component-utilities/stores';
        import { setContext, getContext, beforeUpdate, onDestroy, onMount } from 'svelte';
		import { writable } from 'svelte/store';
        
        // Functions
        import { fmt } from '@evidence-dev/component-utilities/formatting';

		import { CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY, INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
        
        let props;
        export { props as data }; // little hack to make the data name not overlap
        let { data = {}, customFormattingSettings, __db } = props;
        $: ({ data = {}, customFormattingSettings, __db } = props);

        $routeHash = '${routeH}';

		${/* 
			do not switch to $: inputs = $inputs_store
			reactive statements do not rerun during SSR 
		*/''}
		let inputs_store = writable({});
		setContext(INPUTS_CONTEXT_KEY, inputs_store);

		let inputs = {};
		onDestroy(inputs_store.subscribe((value) => inputs = value));

        $: pageHasQueries.set(Object.keys(data).length > 0);

        setContext(CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY, {
            getCustomFormats: () => {
                return customFormattingSettings.customFormats || [];
            }
        });

        ${queryDeclarations}
    `;

	return defaultProps;
};

/**
 * @type {(componentDevelopmentMode: boolean) => import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
const processQueries = (componentDevelopmentMode) => {
	const dynamicQueries = {};
	return {
		markup({ content, filename }) {
			if (filename.endsWith('.md')) {
				let fileQueries = extractQueries(content);
				dynamicQueries[getRouteHash(filename)] = fileQueries.reduce((acc, q) => {
					acc[q.id] = q.compiledQueryString;
					return acc;
				}, {});

				const externalQueryViews =
					'\n\n\n' +
					fileQueries
						.filter((q) => !q.inline)
						.map((q) => {
							return highlighter(q.compiledQueryString, q.id.toLowerCase());
						})
						.join('\n');

				// Page contains frontmatter
				const frontmatter = containsFrontmatter(content);
				if (frontmatter) {
					const contentWithoutFrontmatter = content.substring(frontmatter.length + 6);
					const output =
						`---\n${frontmatter}\n---` + externalQueryViews + contentWithoutFrontmatter;
					return {
						code: output
					};
				}

				return {
					code: externalQueryViews + content
				};
			}
		},
		script({ content, filename, attributes }) {
			if (filename.endsWith('.md')) {
				if (attributes.context != 'module') {
					const duckdbQueries = dynamicQueries[getRouteHash(filename)];
					return {
						code: createDefaultProps(filename, componentDevelopmentMode, duckdbQueries) + content
					};
				}
			}
		}
	};
};
module.exports = processQueries;
