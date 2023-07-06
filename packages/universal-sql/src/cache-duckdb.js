// import { tableFromJSON, tableToIPC, Table } from "apache-arrow/table";
import { writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync } from "fs";
import { basename } from "path";

/**
 * Caches DuckDB queries that have been 
 * @param {string} route_hash md5 hash of the route id
 * @param {string} sql_string SQL string executed
 * @param {string} query_name name of the query
 * @param {import("apache-arrow").Table} data result of the query
 * @returns {void}
 */
export function cache_for_hash(route_hash, sql_string, query_name, data) {
    const sql_path = `./.evidence-queries/cache/${route_hash}/_queries.json`;
    if (!existsSync(sql_path)) {
        mkdirSync(`./.evidence-queries/cache/${route_hash}`, { recursive: true });
        writeFileSync(sql_path, "[]");
    }
    const sql_cache = new Set(JSON.parse(readFileSync(sql_path, "utf-8")));
    sql_cache.add(sql_string);
    writeFileSync(sql_path, JSON.stringify(Array.from(sql_cache)));

    const route_path = `./.evidence-queries/cache/${route_hash}/${query_name}.json`;
    writeFileSync(route_path, JSON.stringify(data.toArray().map((row) => row.toJSON())));

    // for buildtime
    // dependent on https://github.com/sveltejs/kit/blob/master/packages/kit/src/core/adapt/builder.js#L183 writeClient
    mkdirSync(`./.svelte-kit/output/client/api`, { recursive: true });
    writeFileSync(`./.svelte-kit/output/client/api/${route_hash}.json`, JSON.stringify(get_cached_sql(route_hash)));

    // for dev time
    mkdirSync(`./static/api`, { recursive: true });
    writeFileSync(`./static/api/${route_hash}.json`, JSON.stringify(get_cached_sql(route_hash)));
}

/**
 * Gets the cached SQL results for a route hash
 * @param {string} route_hash md5 hash of the route id
 * @returns {Record<string, unknown>}
 */
export function get_cached_sql(route_hash) {
    const route_path = `./.evidence-queries/cache/${route_hash}`;
    if (!existsSync(route_path)) return {};

    const data = {};
    const files = readdirSync(route_path);
    for (const file of files) {
        if (file === "_queries.json") continue;
        data[basename(file, ".json")] = JSON.parse(readFileSync(`${route_path}/${file}`, "utf-8"));
    }

    return data;
}
