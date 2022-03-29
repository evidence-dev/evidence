const { readdirSync, readJSONSync, writeJSONSync, pathExistsSync, emptyDirSync, mkdirSync } = require('fs-extra')
const md5 = require("blueimp-md5")
const chalk = require('chalk')
const logEvent = require('@evidence-dev/telemetry')
const readline = require('readline');

const getCache = function (dev, queryString, queryTime) {
    queryTime = md5(queryTime)
    if (dev) {
        const cache = readJSONSync("./queries/cache/" + queryTime + "/" + md5(queryString) + ".json", { throws: false })
        if (cache) {
            logEvent("cache-query", dev)
            return cache
        }
    }
}

const updateCache = function (dev, queryString, data, queryTime) {
    queryTime = md5(queryTime)
    if (dev) {
        if (!pathExistsSync("./queries")) {
            mkdirSync("./queries")
        }
        if (!pathExistsSync("./queries/cache/")) {
            mkdirSync("./queries/cache/")
        }
        if (!pathExistsSync("./queries/cache/" + queryTime)) {
            emptyDirSync('./queries/cache/')
            mkdirSync("./queries/cache/" + queryTime)
        }
        writeJSONSync("./queries/cache/" + queryTime + "/" + md5(queryString) + ".json", data, { throws: false })
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

const runQueries = async function (routeHash, dev) {
    const database = readJSONSync('./evidence.settings.json',{throws:false})
    const config = readJSONSync('./evidence.config.json', {throws:false})

    let routePath = `./queries/extracted/${routeHash}`
    let queryFile = `${routePath}/${readdirSync(routePath)}`
    let queries = readJSONSync(queryFile, { throws: false }) 

    const { default: runQuery } = await import('@evidence-dev/'+ config.database);
    
    if (queries.length > 0) {
        let data = {}
        data["evidencemeta"] = {queries} // eventually move to seperate metadata API (md frontmatter etc.) 
        for (let query of queries) {
            let queryTime = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours());              
            let cache = getCache(dev, query.compiledQueryString, queryTime)
            if (cache) {
                data[query.id] = cache
                process.stdout.write(chalk.greenBright("✓ "+ query.id) +  chalk.grey(" from cache \n"))
            } else {
                try {
                    process.stdout.write(chalk.grey("  "+ query.id +" running..."))
                    validateQuery(query)
                    data[query.id] = await runQuery(query.compiledQueryString, database, dev)
                    readline.cursorTo(process.stdout, 0);
                    process.stdout.write(chalk.greenBright("✓ "+ query.id) + chalk.grey(" from database \n"))
                    updateCache(dev, query.compiledQueryString, data[query.id], queryTime)
                    logEvent("db-query", dev)
                } catch(err) {
                    readline.cursorTo(process.stdout, 0);
                    process.stdout.write(chalk.red("✗ "+ query.id) + " " + chalk.grey(err) + " \n")
                    data[query.id] = [ { error_object: {error: { message: err } } } ]
                    logEvent("db-error", dev)
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
    let queryResult;
    let result;
    const database = readJSONSync('./.evidence/database.config.json',{throws:false})
    const config = readJSONSync('./evidence.config.json', {throws:false})

    const { default: runQuery } = await import('@evidence-dev/'+ config.database);

    try {
        process.stdout.write(chalk.grey("  "+ query.id +" running..."))
        queryResult = await runQuery(query.compiledQueryString, database)
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
