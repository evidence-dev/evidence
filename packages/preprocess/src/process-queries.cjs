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

		queryDeclarations += `
            import debounce from 'debounce';
            import { browser, dev } from '$app/environment';
			import { profile } from '@evidence-dev/component-utilities/profile';
			
			// partially bypasses weird reactivity stuff with \`select\` elements
			function data_update(data) {
				${valid_ids.map((id) => `
					${id} = data.${id} ?? [];
				`).join('\n')}
			}

			$: data_update(data);

			${valid_ids.map((id) => `
				$: _query_string_${id} = \`${duckdbQueries[id].replaceAll('`', '\\`')}\`;
				let ${id} = data.${id} ?? [];
			`).join('\n')}

			${prerendered_ids.map((id) => `
				$: if (!browser) {
					${id} = profile(__db.query, _query_string_${id}, "${id}");
				}
				$: if (dev && browser) {
					profile(__db.query, _query_string_${id}).then((value) => ${id} = value);
				}
			`).join('\n')}

            ${reactive_ids.map((id) => `
				const _query_${id} = browser
					? debounce((query) => profile(__db.query, query).then((value) => ${id} = value), 200)
					: (query) => (${id} = profile(__db.query, query, "${id}"));

				$: _query_${id}(_query_string_${id});
			`).join('\n')}

			if (!browser) {
				onDestroy(inputs_store.subscribe((inputs) => {
                    // do not switch to using _query_string, we need the string to re-evaluate (no reactivity on server)
					${input_ids.map((id) => `
						${id} = _query_${id}(\`${duckdbQueries[id].replaceAll('`', '\\`')}\`);
					`).join('\n')}
				}));
			}
        `;
	}

	let defaultProps = `
        import { page } from '$app/stores';
        import { pageHasQueries, routeHash } from '@evidence-dev/component-utilities/stores';
        import { setContext, getContext, beforeUpdate, onDestroy } from 'svelte';
		import { writable } from 'svelte/store';
        
        // Functions
        import { fmt } from '@evidence-dev/component-utilities/formatting';

		import { CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY, INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
        
        let props;
        export { props as data }; // little hack to make the data name not overlap
        let { data = {}, customFormattingSettings, __db } = props;
        $: ({ data = {}, customFormattingSettings, __db } = props);

        $routeHash = '${routeH}';

		// do not switch to $: inputs = $inputs_store
		// reactive statements do not rerun during SSR
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
