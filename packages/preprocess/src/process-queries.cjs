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
			    _query_string${id} is just a static string (no interpolation), so everything is constant
			    we might want to be reactive to the data prop - a forced _${id}.fetch() might be good
			    ala $: data, _${id}.fetch();
				that would happen when stuff is invalidated (in dev mode) like when source
				parquet changes (e.g. source refresh experience PR)
			*/
			return `
				const _query_string_${id} = \`${duckdbQueries[id].replaceAll('`', '\\`')}\`;

				const getInitialData${id} = () => {
					if (data.${id}) return { initialData: data.${id} }
					try {
						return { initialData: profile(__db.query, _query_string_${id}, '${id}') }
					} catch (e) {
						if (typeof process !== "undefined") {
							// If building in strict mode; we should fail, this query broke
							if (process.env.VITE_BUILD_STRICT) throw e;
						}
						return { initialError: e }
					}
				}


				const _${id} = new QueryStore(_query_string_${id}, queryFunc, '${id}', { scoreNotifier, ...getInitialData${id}()  });
			`;
		});

		const reactive_query_stores = reactive_ids.map((id) => {
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
				$: _${id}_query_text = \`${duckdbQueries[id].replaceAll('`', '\\`')}\`;

				// Initial Query
				let _${id}_initial_query;
				$: if(!_${id}_initial_query) _${id}_initial_query = _${id}_query_text;
				onMount(() => _${id}_initial_query = _${id}_query_text);
		
				// Current Query
				$: _${id}_current_query = _${id}_query_text;
				
				// Query has changed
				$: _${id}_changed = browser ? _${id}_current_query !== _${id}_initial_query : false;
				
				// Actual Query Execution
				let _${id};
				const _${id}_reactivity_manager = () => {
					const update = () => {
						let initialData, initialError;

						try {
							if (_${id}_changed) {
								// Query changed after page load, we have no prerendered results
								initialData = undefined
								initialError = undefined
							} else if (data.${id}) {
								// Data is coming from SSR
								initialData = data.${id}
							} else {
								// We are currently prerendering
								initialData = profile(__db.query, _${id}_query_text, '${id}')
							}
							
						} catch (e) {
							if (typeof process !== "undefined") {
								// If building in strict mode; we should fail, this query broke
								if (process.env.VITE_BUILD_STRICT) throw e;
							}
							initialData = []
							initialError = e
						}

						const query_store = new QueryStore(
							_${id}_query_text,
							queryFunc,
							'${id}',
							{
								scoreNotifier,
								initialData: initialData,
								initialError: initialError
							}
						);
		
						if (_${id}) {
							// Query has already been created
							// Fetch the data and then replace
							const fetch_maybepromise = query_store.fetch();
							if (fetch_maybepromise instanceof Promise) {
								fetch_maybepromise.then(() => (_${id} = query_store));
							} else {
								_${id} = query_store;
							}
						} else {
							_${id} = query_store;
						}
					};
		
					update();
		
					return debounce(update, 500);
				}
		
				let _${id}_debounced_updater;
				// make sure svelte knows debounced updater is dependent on query text
				$: if (typeof _${id}_debounced_updater === 'undefined') {
                    _${id}_query_text;
                    _${id}_debounced_updater = _${id}_reactivity_manager();
                };
				$: _${id}_query_text, _${id}_debounced_updater();
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
					${id} = get(new QueryStore(
						\`${duckdbQueries[id].replaceAll('`', '\\`')}\`,
						queryFunc,
						'${id}',
						{ initialData: queryFunc(\`${duckdbQueries[id].replaceAll('`', '\\`')}\`, '${id}') }
					));
				`).join('\n')}
			}));
		}
		`;

		const all_query_stores = valid_ids.map((id) => `$: ${id} = $_${id};`);

		queryDeclarations += `
		import { browser, dev } from "$app/environment";
		import { profile } from '@evidence-dev/component-utilities/profile';
		import debounce from 'debounce';
		import { QueryStore } from '@evidence-dev/query-store';
		import { setQueryFunction } from '@evidence-dev/component-utilities/buildQuery';

		const queryFunc = (query, query_name) => profile(__db.query, query, { query_name });
		setQueryFunction(queryFunc);

		const scoreNotifier = !dev? () => {} : (info) => {
			toasts.add({
				id: Math.random(),
				title: info.id,
				message: \`Results estimated to use \${
					Intl.NumberFormat().format(info.score / (1024 * 1024))
				}mb of memory, performance may be impacted\`,
				status: 'warning'
			}, 5000);
		};
		
		${prerendered_query_stores.join('\n')}
		${reactive_query_stores.join('\n')}
		${input_query_stores}
		${all_query_stores.join('\n')}
		`;
	}

	let defaultProps = `
        import { page } from '$app/stores';
        import { pageHasQueries, routeHash, toasts } from '@evidence-dev/component-utilities/stores';
        import { setContext, getContext, beforeUpdate, onDestroy, onMount } from 'svelte';
		import { writable, get } from 'svelte/store';
        
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
