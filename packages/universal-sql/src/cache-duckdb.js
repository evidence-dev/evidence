import { arrowToIPC } from "apache-arrow";
import { writeFileSync, readFileSync, existsSync, readdirSync } from "fs";
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
    const sql_path = `./.evidence-queries/cache/${route_hash}/queries.json`;
    if (!existsSync(sql_path)) writeFileSync(sql_path, "[]");
    const sql_cache = new Set(JSON.parse(readFileSync(sql_path, "utf-8")));
    sql_cache.add(sql_string);
    writeFileSync(sql_path, JSON.stringify(Array.from(sql_cache)));

    const route_path = `./.evidence-queries/cache/${route_hash}/${query_name}.arrow`;
    writeFileSync(route_path, arrowToIPC(data));
}

/**
 * Gets the cached SQL for a route hash
 * @param {string} route_hash md5 hash of the route id
 * @returns {FormData}
 */
export function get_cached_sql(route_hash) {
    const route_path = `./.evidence-queries/cache/${route_hash}`;
    if (!existsSync(route_path)) return new FormData();

    const form_data = new FormData();
    const files = readdirSync(route_path);
    for (const file of files) {
        if (!(file.endsWith(".arrow"))) continue;
        form_data.append(basename(file, ".arrow"), readFileSync(`${route_path}/${file}`));
    }
    return form_data;
}
