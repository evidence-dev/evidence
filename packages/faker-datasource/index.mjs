import {faker} from "@faker-js/faker"
import yaml from "yaml"

/** @typedef {"number" | "id" | "uuid" | "animal" } ColumnType */

/**
 * @typedef {Object} SchemaColumnDef
 * @property {ColumnType} type
 */

/**
 * @typedef {Object} OutputColumnType
 * @property {string} name
 * @property {'boolean' | 'number' | 'string' | 'date'} evidenceType
 * @property {'precise' | 'inferred'} typeFidelity
 */

/**
 * @param {unknown} t
 * @return {Omit<OutputColumnType, "name">}
 */
const getColumnType = (t) => {
    switch (typeof t) {
        case "number":
            return {
                evidenceType: "number",
                typeFidelity: "precise"
            }
        case "string":
            return {
                evidenceType: "string",
                typeFidelity: "precise"
            }
        case "boolean":
            return {
                evidenceType: "boolean",
                typeFidelity: "precise"
            }
        default:
            if (t instanceof Date) {
                return {
                    evidenceType: "date",
                    typeFidelity: "precise"
                }
            }
            console.log(t)
            throw new Error("could not infer type of ", t)
    }
}

/**
 * @param {Record<string, unknown>} row
 */
const buildOutputTypes = (row) => {
    /** @type {OutputColumnType[]} */
    const outputColumnTypes = []
    for (const colName in row) {
        outputColumnTypes.push({
            name: colName,
            ...getColumnType(row[colName])
        })
    }
    return outputColumnTypes
}

const buildRow = (schema, tableName, rowNum) => {
    const output = {}
    for (const colName in schema) {
        if (schema[colName].type === "id") {
            output[colName] = rowNum
        } else {
            const {category, item, options} = schema[colName]
            if (!(category in faker)) throw new Error(`${category} is not a valid category; please see https://fakerjs.dev/api/`)
            if (!(item in faker[category])) throw new Error(`${category}.${item} does not exist; please see https://fakerjs.dev/api/`)
            output[colName] = faker[category][item](options)
        }

    }
    return output
}

/**
 * @param {{}} options
 * @param {string} directory
 */
export const getRunner = (options, directory) => {
    console.warn("You are using the faker-datasource, this is not recommended for production use.")
    return async (content, path) => {
        const definition = yaml.parse(content)

        if (!("rows" in definition)) throw new Error(`${path.split("/").pop()} is missing required required field "rows"`)
        if (!(typeof definition.rows === "number")) throw new Error(`${path.split("/").pop()} "rows" must be a number`)
        if (!("schema" in definition)) throw new Error(`${path.split("/").pop()} is missing required required field "schema"`)
        if (!(typeof definition.schema === "object")) throw new Error(`${path.split("/").pop()} "schema" must be an object`)

        const name = path.split("/").pop().split(".").shift()

        const rows = []

        for (let i = 0; i < definition.rows; i++) {
            rows.push(await buildRow(definition.schema, name, i))
        }

        return {
            rows: rows,
            columnTypes: buildOutputTypes(rows[0])
        }
    }
}