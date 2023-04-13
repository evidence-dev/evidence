const { getRouteHash } = require('./utils/get-route-hash.cjs');
const { extractQueries } = require('./extract-queries/extract-queries.cjs');
const { highlighter } = require('./utils/highlighter.cjs');
const { frontmatterRegex, containsFrontmatter } = require('./frontmatter/frontmatter.regex.cjs');

const createDefaultProps = function (filename, componentDevelopmentMode, fileQueryIds) {
	const routeH = getRouteHash(filename);

	let queryDeclarations = '';

	if (fileQueryIds?.length > 0) {
		// Get query results from load function
		queryDeclarations = `
        let {${fileQueryIds
					?.filter((queryId) => queryId.match('^([a-zA-Z_$][a-zA-Z0-9d_$]*)$'))
					.map((id) => id)} } = data;
        $: ({${fileQueryIds
					?.filter((queryId) => queryId.match('^([a-zA-Z_$][a-zA-Z0-9d_$]*)$'))
					.map((id) => id)} } = data);
        `;
	}

	let defaultProps = `
        import { page } from '$app/stores';
        import { pageHasQueries, routeHash } from '$lib/ui/stores';
        import { setContext, getContext, beforeUpdate } from 'svelte';
        import BigLink from '$lib/ui/BigLink.svelte';
        import VennDiagram from '$lib/diagrams/VennDiagram.svelte';
        import SankeyDiagram from "$lib/diagrams/SankeyDiagram.svelte";
        import Value from '$lib/viz/Value.svelte';
        import BigValue from '$lib/viz/BigValue.svelte';
        import Chart from '$lib/viz/Chart.svelte';
        import Area from '$lib/viz/Area.svelte';
        import Line from '$lib/viz/Line.svelte';
        import Bar from '$lib/viz/Bar.svelte';
        import Bubble from '$lib/viz/Bubble.svelte';
        import Scatter from '$lib/viz/Scatter.svelte';
        import Hist from '$lib/viz/Hist.svelte';
        import AreaChart from '$lib/viz/AreaChart.svelte';
        import BarChart from '$lib/viz/BarChart.svelte';
        import BubbleChart from '$lib/viz/BubbleChart.svelte';
        import DataTable from '$lib/viz/DataTable.svelte';
        import Column from '$lib/viz/Column.svelte';
        import LineChart from '$lib/viz/LineChart.svelte';
        import FunnelChart from "$lib/viz/FunnelChart.svelte";
        import SankeyChart from "$lib/viz/SankeyChart.svelte";
        import ScatterPlot from '$lib/viz/ScatterPlot.svelte';
        import Histogram from '$lib/viz/Histogram.svelte';
        import ECharts from '$lib/viz/ECharts.svelte';
        import USMap from '$lib/viz/USMap.svelte';
        import QueryViewer from '$lib/ui/QueryViewer.svelte';
        import CodeBlock from '$lib/ui/CodeBlock.svelte';

        import Alert from '$lib/ui/Alert.svelte';

        import Tabs from '$lib/ui/Tabs/Tabs.svelte';
        import Tab from '$lib/ui/Tabs/Tab.svelte';

        import { CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY } from '$lib/modules/globalContexts';
        
        let props;
        export { props as data }; // little hack to make the data name not overlap
        let { data = {}, customFormattingSettings } = props;
        $: ({ data = {}, customFormattingSettings } = props);

        $routeHash = '${routeH}';

        $: data, Object.keys(data).length > 0 ? pageHasQueries.set(true) : pageHasQueries.set(false);

        setContext(CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY, {
            getCustomFormats: () => {
                return customFormattingSettings.customFormats || [];
            }
        });
        
        const applyEvidenceTypes = function(data) {

            let includedQueries = data.evidencemeta?.queries

            if(includedQueries) {
                // iterate through each query 
                for(let i = 0; i < includedQueries.length; i++) {
                    // for each of the query objects in data
                    let query = data[includedQueries[i].id]
                    let colTypes = data.evidencemeta?.queries[i].columnTypes
                    // iterate through each row in the query
                    for(let j = 0; j < query.length; j++) {
                        // for each row in the query
                        if(colTypes) {
                            // include column types in the row object as a non enumerable property
                            Object.defineProperty(query[j], '_evidenceColumnTypes', {
                                enumerable: false,
                                value: colTypes,
                            });
                        }
                    }
                }
            }
    
        }
    
        beforeUpdate(() => {
            applyEvidenceTypes(data)
        })

        ${queryDeclarations}
        `;

	return defaultProps;
};

/**
 * @type {(componentDevelopmentMode: boolean) => import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
const processQueries = (componentDevelopmentMode) => {
	let queryIdsByFile = {};
	return {
		markup({ content, filename }) {
			if (filename.endsWith('.md')) {
				let fileQueries = extractQueries(content);
				queryIdsByFile[getRouteHash(filename)] = fileQueries.map((q) => q.id);

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
					let queryIds = queryIdsByFile[getRouteHash(filename)];
					return {
						code: createDefaultProps(filename, componentDevelopmentMode, queryIds) + content
					};
				}
			}
		}
	};
};
module.exports = processQueries;
