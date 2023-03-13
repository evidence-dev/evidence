const { readdirSync, readJSONSync, writeJSONSync, pathExistsSync, emptyDirSync, mkdirSync } = require('fs-extra')
const md5 = require("blueimp-md5")
const chalk = require('chalk')
const logEvent = require('@evidence-dev/telemetry')
const readline = require('readline');
const strictBuild = (process.env.VITE_BUILD_STRICT === 'true')
const cacheDirectory = "./.evidence-queries/cache";

const getQueryCachePaths = (queryString, queryTime) => {
    let queryTimeMD5 = md5(queryTime);
    let queryStringMD5 = md5(queryString);
    let path = `${cacheDirectory}/${queryTimeMD5}`;
    return {
        'cacheDirectory': path,
        'resultsCacheFile': `${cacheDirectory}/${queryTimeMD5}/${queryStringMD5}.json`,
        'columnTypeCacheFile': `${cacheDirectory}/${queryTimeMD5}/${queryStringMD5}-column-types.json`,
    }
}

const updateCache = function (queryString, data, columnTypes, queryTime) {
    const {cacheDirectory, resultsCacheFile, columnTypeCacheFile} = getQueryCachePaths(queryString, queryTime);
    if (!pathExistsSync(cacheDirectory)) {
        emptyDirSync(cacheDirectory);
        mkdirSync(cacheDirectory, { recursive: true });
    }
    writeJSONSync(resultsCacheFile, data, { throws: false });
    if (columnTypes) {
        writeJSONSync(columnTypeCacheFile, columnTypes, { throws: false });
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

/** adds columnTypes to metadata in the page `data` object */
const populateColumnTypeMetadata = (data, queryIndex, columnTypes) => {
    let queryMetaData = data.evidencemeta?.queries?.[queryIndex];
    if (queryMetaData && columnTypes) {
        queryMetaData.columnTypes = columnTypes;
    }
} 

const runQueries = async function (routeHash, dev) {
    const settings = readJSONSync('./evidence.settings.json', {throws:false})
    const runQuery = await importDBAdapter(settings)
    let routePath = `./.evidence-queries/extracted/${routeHash}`
    let queryFile = `${routePath}/queries.json`
    let queries = readJSONSync(queryFile, { throws: false }) 
    let metaQueries = readJSONSync(queryFile, { throws: false })
    let data = {}
    if (queries && queries.length > 0) {
        data.evidencemeta = {}
        data.evidencemeta.queries = metaQueries // eventually move to seperate metadata API (md frontmatter etc.)
        for (let queryIndex in queries) {
            let query = queries[queryIndex];
            let queryTime = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours());
            let cache, columnTypeCache;
            const { resultsCacheFile, columnTypeCacheFile } = getQueryCachePaths(query.compiledQueryString, queryTime);
            cache = readJSONSync(resultsCacheFile, { throws: false });
            columnTypeCache = readJSONSync(columnTypeCacheFile, { throws: false });

            if (cache) {
                logEvent("cache-query", dev, settings);
                data[query.id] = cache;
                if (columnTypeCache) {
                    populateColumnTypeMetadata(data, queryIndex, columnTypeCache);
                }
                process.stdout.write(chalk.greenBright("✓ "+ query.id) +  chalk.grey(" from cache \n"));
                queries[queryIndex].status = "from cache"
                writeJSONSync(queryFile, queries)
            } else {
                try {
                    queries[queryIndex].status = "running"
                    writeJSONSync(queryFile, queries)
                    process.stdout.write(chalk.grey("  "+ query.id +" running..."));
                    validateQuery(query);

                    let {rows, columnTypes} = await runQuery(query.compiledQueryString, settings?.credentials, dev);

                    data[query.id] = rows;
                    populateColumnTypeMetadata(data, queryIndex, columnTypes);

                    readline.cursorTo(process.stdout, 0);
                    process.stdout.write(chalk.greenBright("✓ "+ query.id) + chalk.grey(" from database \n"))

                    queries[queryIndex].status = "done"
                    writeJSONSync(queryFile, queries)

                    updateCache(query.compiledQueryString, data[query.id], columnTypes, queryTime);

                    logEvent("db-query", dev, settings)
                } catch(err) {
                    readline.cursorTo(process.stdout, 0);
                    process.stdout.write(chalk.red("✗ "+ query.id) + " " + chalk.grey(err) + " \n")
                    data[query.id] = [ { error_object: {error: { message: err } } } ]
                    logEvent("db-error", dev, settings)
                    queries[queryIndex].status = "error"
                    writeJSONSync(queryFile, queries)
                    // if build is strict and the query fails, stop the build
                    if(strictBuild){
                        throw err
                    }
                } 
            }
        }
    } 
    return data
}


const testConnection = async function (dev) {
    let query = {
        id: "Connection Test",
        compiledQueryString: "select 100 as num"
    }
    let result;
    const settings = readJSONSync('./evidence.settings.json', {throws:false})

    const { default: runQuery } = await import('@evidence-dev/'+ settings.database);

    try {
        process.stdout.write(chalk.grey("  "+ query.id +" running..."))
        await runQuery(query.compiledQueryString, settings.credentials)
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(chalk.greenBright("✓ "+ query.id) + chalk.grey(" from database \n"))
        result = "Database Connected";
        logEvent("db-connection-success", dev, settings)
    } catch(err) {
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(chalk.red("✗ "+ query.id) + " " + chalk.grey(err) + " \n")
        result = err;
        logEvent("db-connection-error", dev, settings)
        // if build is strict and database connection fails, stop the build
        if(strictBuild){
            throw err
        }
    } 
    return result
}

module.exports = {
    runQueries,
    testConnection
}
