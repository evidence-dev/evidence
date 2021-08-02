const { readdirSync, readJSONSync, writeJSONSync, pathExistsSync, emptyDirSync, mkdirSync } = require('fs-extra')
const md5 = require("blueimp-md5")
const chalk = require('chalk')
const logEvent = require('@evidence-dev/telemetry')

const getCache = function (dev, queryString, queryTime) {
    queryTime = md5(queryTime)
    if (dev) {
        const devCache = readJSONSync("./.evidence/dev/cache/" + queryTime + "/" + md5(queryString) + ".json", { throws: false })
        if (devCache) {
            logEvent("cache-query", dev)
            return devCache
        }
    }
}

const updateCache = function (dev, queryString, data, queryTime) {
    queryTime = md5(queryTime)
    if (dev) {
        if (!pathExistsSync("./.evidence/dev")) {
            mkdirSync("./.evidence/dev")
        }
        if (!pathExistsSync("./.evidence/dev/cache/")) {
            mkdirSync("./.evidence/dev/cache/")
        }
        if (!pathExistsSync("./.evidence/dev/cache/" + queryTime)) {
            emptyDirSync('./.evidence/dev/cache/')
            mkdirSync("./.evidence/dev/cache/" + queryTime)
        }
        writeJSONSync("./.evidence/dev/cache/" + queryTime + "/" + md5(queryString) + ".json", data, { throws: false })
    }
}

const runQueries = async function (routeHash, database, config, dev) {
    let routePath = `./.evidence/build/queries/${routeHash}`
    let queryFile = `${routePath}/${readdirSync(routePath)}`
    let queries = readJSONSync(queryFile, { throws: false }) 

    const { default: runQuery } = await import('@evidence-dev/'+ config.database);
    
    if (queries.length > 0) {
        let data = {}
        for (let query of queries) {
            if (query.id === 'untitled') {
                data[query.id] = { error: { message: "Queries require a title" } }
            }
            if (query.queryString.length === 0) {
                data[query.id] = { error: { message: "Enter a query" } }
            }
            else {
                let queryTime = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours());              
                let cache = getCache(dev, query.queryString, queryTime)
                if (cache) {
                    data[query.id] = cache
                    process.stdout.write(chalk.greenBright("✓ "+ query.id) +  chalk.grey(" from cache \n"))
                } else {
                    try {
                        process.stdout.write(chalk.grey("  "+ query.id +" running..."))
                        data[query.id] = await runQuery(query.queryString, database, dev)
                        process.stdout.clearLine();
                        process.stdout.cursorTo(0);
                        process.stdout.write(chalk.greenBright("✓ "+ query.id) + chalk.grey(" from database \n"))
                        updateCache(dev, query.queryString, data[query.id], queryTime)
                        logEvent("db-query", dev)
                    } catch(err) {
                        console.log(err)
                        process.stdout.clearLine();
                        process.stdout.cursorTo(0);
                        process.stdout.write(chalk.red("✗ "+ query.id) + " " + chalk.grey(err) + " \n")
                        data[query.id] = { error: { message: err } }
                        logEvent("db-error", dev)

                    } 
                }
            }
        }
        return data
    }
}

module.exports = runQueries