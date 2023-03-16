const mdsvex = require("mdsvex");
const unified = require('unified')
const parse = require('remark-parse')
const visit = require('unist-util-visit')
const md5 = require("blueimp-md5");
const { supportedLangs } = require("./supportedLanguages.cjs");

// This is includes future proofing to add support for Prism highlighting
const PrismComponents = require("prismjs/components");

const getPrismLangs = function(){
    let prismLangs= new Set()
    
    supportedLangs.forEach((supportedLanguage) => {
        prismLangs.add(supportedLanguage)
        if (supportedLanguage in PrismComponents.languages) {
            const languageComponent = PrismComponents.languages[supportedLanguage]
            if (languageComponent.alias) {
                if (Array.isArray(languageComponent.alias)) {
                    languageComponent.alias.forEach(a => prismLangs.add(a))
                } else {
                    prismLangs.add(languageComponent.alias)
                }
            }
        }
    })

    return prismLangs
}

const getRouteHash = function(filename){
    let route = filename.split("/src/pages")[1] === "/+page.md" ? "/" : filename.split("/src/pages")[1].replace(".md","").replace(/\/\+page/g,"")
    const hash = md5(route)
    return hash
}

const createDefaultProps = function(filename, componentDevelopmentMode, fileQueryIds){
    let componentSource = '$lib'
    const routeH = getRouteHash(filename)

    let queryDeclarations = ''
    
    if(fileQueryIds?.length > 0) {
        queryDeclarations = 
        `
        let {${fileQueryIds?.filter(queryId => queryId.match('^([a-zA-Z_$][a-zA-Z0-9\d_$]*)$')).map(id => id)} } = data;
        $: ({${fileQueryIds?.filter(queryId => queryId.match('^([a-zA-Z_$][a-zA-Z0-9\d_$]*)$')).map(id => id)} } = data);
        `
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
        `

    return defaultProps
}

// Unified parser step to ignore indented code blocks. 
// Adapted from the mdsvex source, here: https://github.com/pngwn/MDsveX/blob/master/packages/mdsvex/src/parsers/index.ts
// Discussion & background here:  https://github.com/evidence-dev/evidence/issues/286
const ignoreIndentedCode = function() {
	const Parser = this.Parser;
	const block_tokenizers = Parser.prototype.blockTokenizers;
	block_tokenizers.indentedCode = () => true;
}

const getQueryIds = function(content){
    let queryIds = [];  
    let tree = unified()
        .use(parse)
        .use(ignoreIndentedCode)
        .parse(content)   

    visit(tree, 'code', function(node) {
        let id = node.lang ?? 'untitled'
         // Prevent "real" code blocks from being interpreted as queries
         if (!getPrismLangs().has(id.toLowerCase())){
             queryIds.push(id)
         }
    });
    return queryIds;
}

function highlighter(code, lang) {
    code = code.replace(/'/g, "&apos;");
    code = code.replace(/"/g, "&quot;");

    // Replace curly braces or Svelte will try to evaluate as a JS expression
    code = code.replace(/{/g, "&lbrace;").replace(/}/g,"&rbrace;");
    // Ensure that "real" code blocks are rendered not run as queries
    if (getPrismLangs().has(lang.toLowerCase())) {
        return `<CodeBlock source="${code}" copyToClipboard=true></CodeBlock>`;
    }
    return `
    {#if data.${lang} }
        <QueryViewer pageQueries = {data.evidencemeta.queries} queryID = "${lang ?? 'untitled'}" queryResult = {data.${lang ?? 'untitled'}}/> 
    {/if}
    `;
}

module.exports = function evidencePreprocess(componentDevelopmentMode = false){
    let queryIdsByFile = {};
    return [
        {
            markup({content, filename}){
                if(filename.endsWith(".md")){
                    let fileQueryIds = getQueryIds(content);
                    queryIdsByFile[getRouteHash(filename)] = fileQueryIds;
                }
            }
        },
        mdsvex.mdsvex(
            {extensions: [".md"],
            smartypants: {
                quotes: false,
                ellipses: true,
                backticks: true,
                dashes: 'oldschool',
            },
            highlight: {
                highlighter
            },
        }),
        // Add both script tags to all markdown files, if they are missing 
        {
            markup({content, filename}) {
                if(filename.endsWith(".md")){
                    if(!content.match(/\<script(.*)\>/)){
                        return {code: '<script context="module"> </script>' + '<script> </script>' + content}
                    }
                    if(!content.match(/\<script(.*)context\=\"module\"(.*)\>/)){
                        return {code: '<script context="module"> </script>' + content}
                    }
                    if(!content.match(/\<script\>/)){
                        return {code: '<script> </script>' + content}
                    }
                }
            }
        },
        {
            script({content, filename, attributes}) {
                if(filename.endsWith(".md")){
                    if(attributes.context != "module") {
                        let queryIds = queryIdsByFile[getRouteHash(filename)];
                        return {code: createDefaultProps(filename, componentDevelopmentMode, queryIds) + content }
                    }
                }
            }
        }
    ]
} 
