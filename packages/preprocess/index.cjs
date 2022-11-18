const mdsvex = require("mdsvex");
const unified = require('unified')
const parse = require('remark-parse')
const visit = require('unist-util-visit')
const md5 = require("blueimp-md5");
const fs = require('fs')
const fsExtra = require('fs-extra')
const { removeSync, writeJSONSync, emptyDirSync } = fsExtra

const getRouteHash = function(filename){
    let route = filename.split("/src/pages")[1] === "/index.md" ? "/" : filename.split("/src/pages")[1].replace(".md","").replace(/\/index/g,"")
    let routeHash = md5(route)
    return routeHash
}

const hasQueries = function(filename){
    let hash = getRouteHash(filename)
    return fs.existsSync("./.evidence-queries/extracted/"+hash)
}

const createModuleContext = function(filename){
    let routeHash = getRouteHash(filename)
    let moduleContext = 
        ` 
        export async function load({fetch}) {
            const res = await fetch('/api/${routeHash}.json');
            const {data} = await res.json();
            const customFormattingSettingsRes = await fetch('/api/customFormattingSettings.json');
            const { customFormattingSettings } = await customFormattingSettingsRes.json();
            return {
                props: {
                    data,
                    customFormattingSettings
                }
            }
        }
        `

    return moduleContext
} 

const createDefaultProps = function(filename, componentDevelopmentMode, fileQueryIds){
    let componentSource = componentDevelopmentMode ? '$lib' : '@evidence-dev/components';
    let routeHash = getRouteHash(filename)

    let queryDeclarations = ''
    
    if(hasQueries(filename)) {
        queryDeclarations = fileQueryIds?.filter(queryId => queryId.match('^([a-zA-Z_$][a-zA-Z0-9\d_$]*)$'))
        .map(id => `let ${id} 
        $: data, ${id} = data.${id};`)
        .join('\n') || '';  
    } 

    let defaultProps = `
        import { page } from '$app/stores';
        import { pageHasQueries } from '@evidence-dev/components/ui/stores';
        import { setContext, getContext } from 'svelte';
        import BigLink from '${componentSource}/ui/BigLink.svelte';
        import Value from '${componentSource}/viz/Value.svelte';
        import BigValue from '${componentSource}/viz/BigValue.svelte';
        import Chart from '${componentSource}/viz/Chart.svelte';
        import Area from '${componentSource}/viz/Area.svelte';
        import Line from '${componentSource}/viz/Line.svelte';
        import Bar from '${componentSource}/viz/Bar.svelte';
        import Bubble from '${componentSource}/viz/Bubble.svelte';
        import Scatter from '${componentSource}/viz/Scatter.svelte';
        import Hist from '${componentSource}/viz/Hist.svelte';
        import AreaChart from '${componentSource}/viz/AreaChart.svelte';
        import BarChart from '${componentSource}/viz/BarChart.svelte';
        import BubbleChart from '${componentSource}/viz/BubbleChart.svelte';
        import DataTable from '${componentSource}/viz/DataTable.svelte';
        import LineChart from '${componentSource}/viz/LineChart.svelte';
        import ScatterPlot from '${componentSource}/viz/ScatterPlot.svelte';
        import Histogram from '${componentSource}/viz/Histogram.svelte';
        import ECharts from '${componentSource}/viz/ECharts.svelte';
        import QueryViewer from '${componentSource}/ui/QueryViewer.svelte';
        import { CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY } from '${componentSource}/modules/globalContexts';
        
        export let data = {};
        export let customFormattingSettings;
        
        let routeHash = '${routeHash}';

        $: data, Object.keys(data).length > 0 ? pageHasQueries.set(true) : pageHasQueries.set(false);

        setContext(CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY, {
            getCustomFormats: () => {
                return customFormattingSettings.customFormats || [];
            }
        });

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

const updateExtractedQueriesDir = function(content, filename){
    if (!fs.existsSync("./.evidence-queries")){
        fs.mkdirSync("./.evidence-queries");
    }
    if (!fs.existsSync("./.evidence-queries/extracted")){
        fs.mkdirSync("./.evidence-queries/extracted");
    }
    let routeHash = getRouteHash(filename)
    let queryDir = `./.evidence-queries/extracted/${routeHash}`

    let queries = [];  
    let tree = unified()
        .use(parse)
        .use(ignoreIndentedCode)
        .parse(content)   

    visit(tree, 'code', function(node) {
        let id = node.lang ?? 'untitled'
        let compiledQueryString = node.value.trim() // refs get compiled and sent to db orchestrator
        let inputQueryString = compiledQueryString // original, as written 
        let compiled = false // default flag, switched to true if query is compiled
        let status = "not run"
        queries.push(
            {id, compiledQueryString, inputQueryString, compiled, status}
        )
    });

    // Handle query chaining:
    let maxIterations = 100
    let queryIds = queries.map(d => d.id);

    for(let i=0; i<=maxIterations; i++){
        queries.forEach(query => {
            let references = query.compiledQueryString.match(/\${.*?\}/gi)	
            if(references){
                query.compiled = true
                references.forEach(reference => {
                    referencedQueryID = reference.replace("${", "").replace("}", "").trim()
                    if(!queryIds.includes(referencedQueryID)){
                        errorMessage = 'Compiler error: '+ (referencedQueryID === "" ? "missing query reference" :"'"+ referencedQueryID + "'" + " is not a query on this page")
                        query.compileError = errorMessage
                        query.compiledQueryString = errorMessage
                    } else if(i == maxIterations) {
                        // tried 100 times, still have references, likely circular 
                        query.compileError = 'Compiler error: circular reference'
                        query.compiledQueryString = 'Compiler error: circular reference'
                    } else {
                        let referencedQuery = "(" + queries.filter(d => d.id === referencedQueryID)[0].compiledQueryString + ")"
                        try {
                            query.compiledQueryString = query.compiledQueryString.replace(reference, referencedQuery)
                        } catch {
                            // tried <100 times but compiled string is too long, likely circular  
                            query.compileError = 'Compiler error: circular reference'
                            query.compiledQueryString = 'Compiler error: circular reference'
                        }
                    }
                }) 
            } 
        })
    }

    if (queries.length === 0) {
        removeSync(queryDir)
        return [];
    }
    if (queries.length > 0) {
        if(!fs.existsSync(queryDir)){
            fs.mkdirSync(queryDir)
            writeJSONSync(`${queryDir}/queries.json`, queries);
        }else{
            emptyDirSync(queryDir)
            writeJSONSync(`${queryDir}/queries.json`, queries);
        }
    }
    return queryIds;
}

function highlighter(code, lang) {
    code = code.replace(/'/g, "&apos;");
    code = code.replace(/"/g, "&quot;");

    // Repalce curly braces or Svelte will try to evaluate as a JS expression
    code = code.replace(/{/g, "&lbrace;").replace(/}/g,"&rbrace;");
    return `
    {#if data.${lang} }
        <QueryViewer pageQueries = {data.evidencemeta.queries} queryID = "${lang ?? 'untitled'}" queryResult = {data.${lang ?? 'untitled'}}/> 
    {/if}
    `;
}

// 

module.exports = function evidencePreprocess(componentDevelopmentMode = false){
    let queryIdsByFile = {};
    return [
        {
            markup({content, filename}){
                if(filename.endsWith(".md")){
                    let fileQueryIds = updateExtractedQueriesDir(content, filename);
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
            script({filename, attributes}) { 
                if(filename.endsWith(".md")){
                    if(attributes.context == "module"){
                        return {code: createModuleContext(filename)}
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
