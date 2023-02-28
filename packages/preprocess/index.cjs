const mdsvex = require("mdsvex");
const unified = require('unified')
const parse = require('remark-parse')
const visit = require('unist-util-visit')
const md5 = require("blueimp-md5");
const fs = require('fs')
const fsExtra = require('fs-extra')
const { supportedLangs } = require("./supportedLanguages.cjs");
// This is includes future proofing to add support for Prism highlighting
const PrismComponents = require("prismjs/components");

const getPrismLangs = function () {
    let prismLangs = new Set()

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
const { removeSync, writeJSONSync, emptyDirSync } = fsExtra
const strictBuild = (process.env.VITE_BUILD_STRICT === 'true')
const circularRefErrorMsg = 'Compiler error: circular reference'
const getRouteHash = function (filename) {
    let route = filename.split("/src/pages")[1] === "/index.md" ? "/" : filename.split("/src/pages")[1].replace(".md", "").replace(/\/index/g, "")
    let routeHash = md5(route)
    return routeHash
}

const hasQueries = function (filename) {
    let hash = getRouteHash(filename)
    return fs.existsSync("./.evidence-queries/extracted/" + hash)
}

const createModuleContext = function (filename) {
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

const createDefaultProps = function (filename, componentDevelopmentMode, fileQueryIds) {
    let componentSource = componentDevelopmentMode ? '$lib' : '@evidence-dev/components';
    let routeHash = getRouteHash(filename)

    let queryDeclarations = ''

    if (hasQueries(filename)) {
        queryDeclarations =
            `
        let {${fileQueryIds?.filter(queryId => queryId.match('^([a-zA-Z_$][a-zA-Z0-9\d_$]*)$')).map(id => id)} } = data;
        $: ({${fileQueryIds?.filter(queryId => queryId.match('^([a-zA-Z_$][a-zA-Z0-9\d_$]*)$')).map(id => id)} } = data);
        `
    }

    let defaultProps = `
        import { page } from '$app/stores';
        import { pageHasQueries, routeHash } from '@evidence-dev/components/ui/stores';
        import { setContext, getContext, beforeUpdate } from 'svelte';
        import BigLink from '${componentSource}/ui/BigLink.svelte';
        import VennDiagram from '${componentSource}/diagrams/VennDiagram.svelte';
        import SankeyDiagram from "${componentSource}/diagrams/SankeyDiagram.svelte";
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
        import Column from '${componentSource}/viz/Column.svelte';
        import LineChart from '${componentSource}/viz/LineChart.svelte';
        import FunnelChart from "${componentSource}/viz/FunnelChart.svelte";
        import SankeyChart from "${componentSource}/viz/SankeyChart.svelte";
        import ScatterPlot from '${componentSource}/viz/ScatterPlot.svelte';
        import Histogram from '${componentSource}/viz/Histogram.svelte';
        import ECharts from '${componentSource}/viz/ECharts.svelte';
        import USMap from '${componentSource}/viz/USMap.svelte';
        import QueryViewer from '${componentSource}/ui/QueryViewer.svelte';
        import CodeBlock from '${componentSource}/ui/CodeBlock.svelte';
        import { CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY } from '${componentSource}/modules/globalContexts';
        
        export let data = {};
        export let customFormattingSettings;

        routeHash.set('${routeHash}');

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
const ignoreIndentedCode = function () {
    const Parser = this.Parser;
    const block_tokenizers = Parser.prototype.blockTokenizers;
    block_tokenizers.indentedCode = () => true;
}

const updateExtractedQueriesDir = function (content, filename) {
    if (!fs.existsSync("./.evidence-queries")) {
        fs.mkdirSync("./.evidence-queries");
    }
    if (!fs.existsSync("./.evidence-queries/extracted")) {
        fs.mkdirSync("./.evidence-queries/extracted");
    }
    let routeHash = getRouteHash(filename)
    let queryDir = `./.evidence-queries/extracted/${routeHash}`

    let queries = [];
    let tree = unified()
        .use(parse)
        .use(ignoreIndentedCode)
        .parse(content)

    visit(tree, 'code', function (node) {
        let id = node.lang ?? 'untitled'
        // If language is SQL, check for a queryID after, in which case we want to run the query
        if (id.toLowerCase() === 'sql' && node.meta) {
            id=node.meta;
        }
        // Prevent "real" code blocks from being interpreted as queries
        if (getPrismLangs().has(id.toLowerCase())) return
        let compiledQueryString = node.value.trim() // refs get compiled and sent to db orchestrator
        let inputQueryString = compiledQueryString // original, as written 
        let compiled = false // default flag, switched to true if query is compiled
        let status = "not run"
        queries.push(
            { id, compiledQueryString, inputQueryString, compiled, status }
        )
    });

    // Handle query chaining:
    let maxIterations = 100
    let queryIds = queries.map(d => d.id);

    for (let i = 0; i <= maxIterations; i++) {
        queries.forEach(query => {
            let references = query.compiledQueryString.match(/\${.*?\}/gi)
            if (references) {
                query.compiled = true
                references.forEach(reference => {
                    try {
                        referencedQueryID = reference.replace("${", "").replace("}", "").trim()
                        if (!queryIds.includes(referencedQueryID)) {
                            errorMessage = 'Compiler error: ' + (referencedQueryID === "" ? "missing query reference" : "'" + referencedQueryID + "'" + " is not a query on this page")
                            throw new Error(errorMessage)
                        } else if (i >= maxIterations) {
                            // tried 100 times, still have references, likely circular 
                            throw new Error(circularRefErrorMsg)
                        } else {
                            let referencedQuery = "(" + queries.filter(d => d.id === referencedQueryID)[0].compiledQueryString + ")"
                            query.compiledQueryString = query.compiledQueryString.replace(reference, referencedQuery)
                        }
                    } catch (e) {
                        // if error is unknown use default circular ref. error
                        e = (e.message === undefined || e.message === null) ? Error(circularRefErrorMsg) : e
                        query.compileError = e.message
                        query.compiledQueryString = e.message
                        // if build is strict and we detect an error, force a failure
                        if (strictBuild) {
                            throw new Error(e.message)
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
        if (!fs.existsSync(queryDir)) {
            fs.mkdirSync(queryDir)
            writeJSONSync(`${queryDir}/queries.json`, queries);
        } else {
            emptyDirSync(queryDir)
            writeJSONSync(`${queryDir}/queries.json`, queries);
        }
    }
    return queryIds;
}

function createQueryViewer(queryID) {
    return `
    {#if data.${queryID} }
        <QueryViewer pageQueries = {data.evidencemeta.queries} queryID = "${queryID ?? 'untitled'}" queryResult = {data.${queryID ?? 'untitled'}}/> 
    {/if}
    `;
}

function highlighter(code, arg1, arg2) {
    code = code.replace(/'/g, "&apos;");
    code = code.replace(/"/g, "&quot;");

    // Replace curly braces or Svelte will try to evaluate as a JS expression
    code = code.replace(/{/g, "&lbrace;").replace(/}/g, "&rbrace;");

    // If the first code block argument is "sql", AND there is a second argument, read in second argument to code block as a queryID
    if (arg1.toLowerCase() === "sql" && arg2) {
        if (arg2.includes(" ")) {
            throw new Error("Query ID cannot contain spaces")
        }
        let queryID = arg2 ?? null;
        return createQueryViewer(queryID);
    } 

    // Ensure that "real" code blocks are rendered not run as queries
    else if (getPrismLangs().has(arg1.toLowerCase())) {
        return `<CodeBlock source="${code}" copyToClipboard=true></CodeBlock>`;
    }

    // Else use the first argument as the queryID
    else return createQueryViewer(arg1);
}

// 

module.exports = function evidencePreprocess(componentDevelopmentMode = false) {
    let queryIdsByFile = {};
    return [
        {
            markup({ content, filename }) {
                if (filename.endsWith(".md")) {
                    let fileQueryIds = updateExtractedQueriesDir(content, filename);
                    queryIdsByFile[getRouteHash(filename)] = fileQueryIds;
                }
            }
        },
        mdsvex.mdsvex(
            {
                extensions: [".md"],
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
            markup({ content, filename }) {
                if (filename.endsWith(".md")) {
                    if (!content.match(/\<script(.*)\>/)) {
                        return { code: '<script context="module"> </script>' + '<script> </script>' + content }
                    }
                    if (!content.match(/\<script(.*)context\=\"module\"(.*)\>/)) {
                        return { code: '<script context="module"> </script>' + content }
                    }
                    if (!content.match(/\<script\>/)) {
                        return { code: '<script> </script>' + content }
                    }
                }
            }
        },
        {
            script({ filename, attributes }) {
                if (filename.endsWith(".md")) {
                    if (attributes.context == "module") {
                        return { code: createModuleContext(filename) }
                    }
                }
            }
        },
        {
            script({ content, filename, attributes }) {
                if (filename.endsWith(".md")) {
                    if (attributes.context != "module") {
                        let queryIds = queryIdsByFile[getRouteHash(filename)];
                        return { code: createDefaultProps(filename, componentDevelopmentMode, queryIds) + content }
                    }
                }
            }
        }
    ]
} 
