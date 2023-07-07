/**
 * @typedef {Object} GenericApiOptions
 * @property {string} base_url
 * @property {Record<string, string>} headers
 */

/** @typedef {"number" | "id" | "uuid" | "animal" } ColumnType */

/**
 * @typedef {Object} OutputColumnType
 * @property {string} name
 * @property {'boolean' | 'number' | 'string' | 'date'} evidenceType
 * @property {'precise' | 'inferred'} typeFidelity
 */

import {ApiRequestSpecSchema} from "./schemas.mjs";
import yaml from "yaml";

/**
 * @param {unknown} t
 * @return {Omit<OutputColumnType, "name">}
 */
const getColumnType = (t) => {
    switch (typeof t) {
        case 'number':
            return {
                evidenceType: 'number',
                typeFidelity: 'precise'
            };
        case 'string':
            return {
                evidenceType: 'string',
                typeFidelity: 'precise'
            };
        case 'boolean':
            return {
                evidenceType: 'boolean',
                typeFidelity: 'precise'
            };
        default:
            if (t instanceof Date) {
                return {
                    evidenceType: 'date',
                    typeFidelity: 'precise'
                };
            }
            console.log(t, JSON.stringify(t));
            throw new Error('could not infer type of ', t);
    }
};
const flattenObject = (obj, prefix = '') => {
    if (!prefix && Array.isArray(obj))
        throw new Error('Array found where not expected');
    let flattenedObj = {};

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            let prefixedKey = prefix ? `${prefix}_${key}` : key;

            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                let nestedObj = flattenObject(obj[key], prefixedKey);
                flattenedObj = {...flattenedObj, ...nestedObj};
            } else if (Array.isArray(obj[key])) {
                flattenedObj[prefixedKey] = JSON.stringify(obj[key]);
            } else {
                flattenedObj[prefixedKey] = obj[key];
            }
        }
    }

    return flattenedObj;
}

const normalizeApiResults = (data) => {
    const distinctKeys = new Set();

    // Step 1: Flatten objects and collect distinct keys
    const flattenedObjects = data.map((obj) => {
        const flattenedObj = flattenObject(obj);
        Object.keys(flattenedObj).forEach((key) => distinctKeys.add(key));
        return flattenedObj;
    });

    // Step 2: Convert distinct keys to an array
    const keysArray = Array.from(distinctKeys);

    // Step 3: Ensure all keys appear on all objects
    flattenedObjects.forEach((obj) => {
        keysArray.forEach((key) => {
            if (!(key in obj)) {
                obj[key] = undefined;
            }
        });
    });

    return flattenedObjects;
}

/**
 * @param {Record<string, unknown>[]} rows
 */
const buildOutputTypes = (rows) => {
    const neededKeys = Object.keys(rows[0])
    /** @type {OutputColumnType[]} */
    const outputColumnTypes = [];

    for (const k of neededKeys) {
        for (let i = 0; i < neededKeys.length; i++) {
            if (rows[i][k] !== undefined) {
                outputColumnTypes.push({
                    name: k,
                    ...getColumnType(rows[i][k])
                });
                break;
            }
        }
    }

    return outputColumnTypes;
};


/** @type {import("node-fetch").default} */
let _fetch

/**
 * @param {GenericApiOptions} options
 * @param {string} directory
 */
export const getRunner = (options, directory) => {
    return async (content, filepath) => {
        // TODO: Does this break when running in the browser?
        if (typeof fetch === "undefined" && !_fetch) _fetch = await import("node-fetch").then(r => r.default);

        const rawContent = yaml.parse(content)
        const parsedContent = ApiRequestSpecSchema.safeParse(rawContent)
        if (!parsedContent.success) {
            console.warn(`Encountered errors parsing ${filepath.split('/').pop()}`)
            console.warn(parsedContent.error.flatten())
            process.exit(1)
        }
        /** @type {import("zod").z.infer<typeof import("./schemas.mjs").ApiRequestSpecSchema>} */
        const contentData = parsedContent.data

        const url = new URL(`${options.base_url}${contentData.path}`)
        if (contentData.query) {
            Object.entries(contentData.query).forEach(([k, v]) => url.searchParams.append(k, v)
            )
        }

        const result = await _fetch(url, {
            method: contentData.method,
            headers: options.headers
        }).then(r => r.json()).then(r => contentData.data_field ? r[contentData.data_field] : r).then(r => Array.isArray(r) ? r : [r]).then(normalizeApiResults)

        return {
            rows: result,
            columnTypes: buildOutputTypes(result)
        }

    }
}