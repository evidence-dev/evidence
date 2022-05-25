const { readdirSync, readJSONSync, writeJSONSync, pathExistsSync, emptyDirSync, mkdirSync } = require('fs-extra')
const md5 = require("blueimp-md5")
const chalk = require('chalk')
const logEvent = require('@evidence-dev/telemetry')
const readline = require('readline');

const getCache = function (dev, queryString, queryTime, settings) {
    queryTime = md5(queryTime)
    if (dev) {
        const cache = readJSONSync("./.evidence-queries/cache/" + queryTime + "/" + md5(queryString) + ".json", { throws: false })
        if (cache) {
            logEvent("cache-query", dev, settings)
            return cache
        }
    }
}

const updateCache = function (dev, queryString, data, queryTime) {
    queryTime = md5(queryTime)
    if (dev) {
        if (!pathExistsSync("./.evidence-queries")) {
            mkdirSync("./.evidence-queries")
        }
        if (!pathExistsSync("./.evidence-queries/cache/")) {
            mkdirSync("./.evidence-queries/cache/")
        }
        if (!pathExistsSync("./.evidence-queries/cache/" + queryTime)) {
            emptyDirSync('./.evidence-queries/cache/')
            mkdirSync("./.evidence-queries/cache/" + queryTime)
        }
        writeJSONSync("./.evidence-queries/cache/" + queryTime + "/" + md5(queryString) + ".json", data, { throws: false })
    }
}

const validateQuery = function (query) { 
    if (query.id === 'untitled') {
        throw "Queries require a title"
    }
    if (query.id === 'evidencemeta') {
        throw "Invalid query name: 'evidencemeta'"
    }
    if (query.compiledQueryString.length === 0) {
        throw "Enter a query"
    }
    if (query.compileError) {
        throw query.compileError
    }
}




const importDBAdapter = async function(settings) {
    try {
        databaseType = settings ? settings.database : process.env["DATABASE"] || process.env["database"]
        const { default: runQuery } = await import('@evidence-dev/'+ databaseType);
        return runQuery
    }catch {
        const runQuery = async function(){
            throw 'Missing database credentials'
        }
        return runQuery
    }
}

const runQueries = async function (routeHash, dev) {
    const settings = readJSONSync('./evidence.settings.json', {throws:false})
    const runQuery = await importDBAdapter(settings)

    let routePath = `./.evidence-queries/extracted/${routeHash}`
    let queryFile = `${routePath}/${readdirSync(routePath)}`
    let queries = readJSONSync(queryFile, { throws: false }) 

    
    if (queries.length > 0) {
        let data = {}
        data["evidencemeta"] = {queries} // eventually move to seperate metadata API (md frontmatter etc.) 
        for (let query of queries) {
            let queryTime = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours());              
            let cache = getCache(dev, query.compiledQueryString, queryTime, settings)
            if (cache) {
                data[query.id] = cache
                process.stdout.write(chalk.greenBright("✓ "+ query.id) +  chalk.grey(" from cache \n"))
            } else {
                try {
                    process.stdout.write(chalk.grey("  "+ query.id +" running..."))
                    validateQuery(query)
                    data[query.id] = await runQuery(query.compiledQueryString, settings?.credentials, dev)
                    readline.cursorTo(process.stdout, 0);
                    process.stdout.write(chalk.greenBright("✓ "+ query.id) + chalk.grey(" from database \n"))
                    updateCache(dev, query.compiledQueryString, data[query.id], queryTime)
                    logEvent("db-query", dev, settings)
                } catch(err) {
                    readline.cursorTo(process.stdout, 0);
                    process.stdout.write(chalk.red("✗ "+ query.id) + " " + chalk.grey(err) + " \n")
                    data[query.id] = [ { error_object: {error: { message: err } } } ]
                    logEvent("db-error", dev, settings)
                } 
            }
        }
        return data
    }
}


const testConnection = async function () {
    let query = {
        id: "Connection Test",
        compiledQueryString: "select 100 as num"
    }
    let result;
    const settings = readJSONSync('./evidence.settings.json', {throws:false})

    const { default: runQuery } = await import('@evidence-dev/'+ settings.database);

    try {
        process.stdout.write(chalk.grey("  "+ query.id +" running..."))
        queryResult = await runQuery(query.compiledQueryString, settings.credentials)
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(chalk.greenBright("✓ "+ query.id) + chalk.grey(" from database \n"))
        result = "Database Connected";
    } catch(err) {
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(chalk.red("✗ "+ query.id) + " " + chalk.grey(err) + " \n")
        result = err;
    } 
    return result
}

module.exports = {
    runQueries,
    testConnection
}
