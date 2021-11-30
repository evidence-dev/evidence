const mdsvex = require("mdsvex");
const unified = require('unified')
const parse = require('remark-parse')
const visit = require('unist-util-visit')
const md5 = require("blueimp-md5");
const fs = require('fs')
const fsExtra = require('fs-extra')
const { removeSync, writeJSONSync, emptyDirSync } = fsExtra

const getRouteHash = function(filename){
    let route = filename.split("/src/pages")[1].replace(".md","")
    let routeHash = md5(route)
    return routeHash
}

const hasQueries = function(filename){
    let hash = getRouteHash(filename)
    return fs.existsSync("./.evidence/build/queries/"+hash)
}

const createModuleContext = function(filename){
    let routeHash = getRouteHash(filename)
    let moduleContext = ""
    if(hasQueries(filename)){
        moduleContext = 
            ` 
            export async function load({fetch}) {
                const res = await fetch('/api/${routeHash}.json')
                const {data} = await res.json()
                return {
                    props: {
                        data
                    }
                }
            }
            `
    }
    return moduleContext
} 

const createDefaultProps = function(filename){
    let routeHash = getRouteHash(filename)
    let defaultProps = `
        import { page } from '$app/stores';
        import Value from '@evidence-dev/components/viz/Value.svelte';
        import Chart from '@evidence-dev/components/viz/Chart.svelte';
        import Area from '@evidence-dev/components/viz/Area.svelte';
        import Line from '@evidence-dev/components/viz/Line.svelte';
        import Bar from '@evidence-dev/components/viz/Bar.svelte';
        import Hist from '@evidence-dev/components/viz/Hist.svelte';
        import Bubble from '@evidence-dev/components/viz/Bubble.svelte';
        import Scatter from '@evidence-dev/components/viz/Scatter.svelte';
        import AreaChart from '@evidence-dev/components/viz/AreaChart.svelte';
        import BarChart from '@evidence-dev/components/viz/BarChart.svelte';
        import BubbleChart from '@evidence-dev/components/viz/BubbleChart.svelte';
        import DataTable from '@evidence-dev/components/viz/DataTable.svelte';
        import Histogram from '@evidence-dev/components/viz/Histogram.svelte';
        import LineChart from '@evidence-dev/components/viz/LineChart.svelte';
        import ScatterPlot from '@evidence-dev/components/viz/ScatterPlot.svelte';
        import ECharts from '@evidence-dev/components/viz/ECharts.svelte';
        let routeHash = '${routeHash}'
        `
    if(hasQueries(filename)){
        defaultProps = `
            export let data 
            import { page } from '$app/stores';
            import QueryViewer from '@evidence-dev/components/ui/QueryViewer.svelte';
            import Value from '@evidence-dev/components/viz/Value.svelte';
            import Chart from '@evidence-dev/components/viz/Chart.svelte';
            import Area from '@evidence-dev/components/viz/Area.svelte';
            import Line from '@evidence-dev/components/viz/Line.svelte';
            import Bar from '@evidence-dev/components/viz/Bar.svelte';
            import Hist from '@evidence-dev/components/viz/Hist.svelte';
            import Bubble from '@evidence-dev/components/viz/Bubble.svelte';
            import Scatter from '@evidence-dev/components/viz/Scatter.svelte';
            import AreaChart from '@evidence-dev/components/viz/AreaChart.svelte';
            import BarChart from '@evidence-dev/components/viz/BarChart.svelte';
            import BubbleChart from '@evidence-dev/components/viz/BubbleChart.svelte';
            import DataTable from '@evidence-dev/components/viz/DataTable.svelte';
            import Histogram from '@evidence-dev/components/viz/Histogram.svelte';
            import LineChart from '@evidence-dev/components/viz/LineChart.svelte';
            import ScatterPlot from '@evidence-dev/components/viz/ScatterPlot.svelte';
            import ECharts from '@evidence-dev/components/viz/ECharts.svelte';
            let routeHash = '${routeHash}'
            `
    }
    return defaultProps
}

const updateBuildQueriesDir = function(content, filename){
    if (!fs.existsSync("./.evidence")){
        fs.mkdirSync("./.evidence");
    }
    if (!fs.existsSync("./.evidence/build")){
        fs.mkdirSync("./.evidence/build");
    }
    if (!fs.existsSync("./.evidence/build/queries")){
        fs.mkdirSync("./.evidence/build/queries");
    }
    let routeHash = getRouteHash(filename)
    let queryDir = `./.evidence/build/queries/${routeHash}`

    let queryStrings = [];  
    let tree = unified()
        .use(parse)
        .parse(content)   
    visit(tree, 'code', function(node) {
        let id = node.lang ?? 'untitled'
        let queryString = node.value.trim() // refs get compiled and sent to db orchestrator
        let rawQueryString = queryString // original, as written 
        let compiled = false // default flag, switched to true if query is compiled
        queryStrings.push(
            {id, queryString, rawQueryString, compiled}
        )
    })

    // Handle query chaining:
    let maxIterations = 100
    let queryIds = queryStrings.map(d => d.id);

    for(let i=0; i<=maxIterations; i++){
        queryStrings.forEach(query => {
            let references = query.queryString.match(/\${.*?\}/gi)	
            if(references){
                query.compiled = true
                references.forEach(reference => {
                    referencedQueryID = reference.replace("${", "").replace("}", "")
                    if(!queryIds.includes(referencedQueryID)){
                        errorMessage = 'Compiler error: '+ (referencedQueryID === "" ? "missing query reference" :"'"+ referencedQueryID + "'" + " is not a query on this page")
                        query.compileError = errorMessage
                        query.queryString = errorMessage
                    } else if(i == maxIterations) {
                        // tried 100 times, still have references, likely circular 
                        query.compileError = 'Compiler error: circular reference'
                        query.queryString = 'Compiler error: circular reference'
                    } else {
                        let referencedQuery = "(" + queryStrings.filter(d => d.id === referencedQueryID)[0].queryString + ")"
                        try {
                            query.queryString = query.queryString.replace(reference, referencedQuery)
                        } catch {
                            // tried <100 times but compiled string is too long, likely circular  
                            query.compileError = 'Compiler error: circular reference'
                            query.queryString = 'Compiler error: circular reference'
                        }
                    }
                }) 
            } 
        })
    }

    if (queryStrings.length === 0) {
        removeSync(queryDir)
        return
    }
    let queryHash = md5(JSON.stringify(queryStrings))
    if (fs.existsSync(`${queryDir}/${queryHash}.json`)){
        return
    }
    if (queryStrings.length > 0) {
        if(!fs.existsSync(queryDir)){
            fs.mkdirSync(queryDir)
            writeJSONSync(`${queryDir}/${queryHash}.json`, queryStrings)
        }else{
            emptyDirSync(queryDir)
            writeJSONSync(`${queryDir}/${queryHash}.json`, queryStrings)
        }
    }
}

function highlighter(code, lang) {
    code = code.replace(/'/g, "&apos;");
    code = code.replace(/"/g, "&quot;");

    // Repalce curly braces or Svelte will try to evaluate as a JS expression
    code = code.replace(/{/g, "&lbrace;").replace(/}/g,"&rbrace;");
    return `
    <QueryViewer allQueries = {data.queries} queryString = '${code}' queryID = "${lang ?? 'untitled'}" queryResult = {data.${lang ?? 'untitled'}}/>
    `;
}

module.exports = function evidencePreprocess(){
    return [
        {
            markup({content, filename}){
                if(filename.endsWith(".md")){
                    updateBuildQueriesDir(content, filename)
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
                        return {code: createDefaultProps(filename) + content }
                    }	
                }
            }
        }
    ]
} 
