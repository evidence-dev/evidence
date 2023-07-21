import { describe, it, expect } from 'vitest';
import {QueryResultSchema} from "./query-runner.schema.js";

/** @type {Record<string, QueryResult>} */
const fixtures = {
    properlyFormed: {
        rows: [{x: 1}, {x: 2}, {x: 3}],
        columnTypes: [{
            name: "x",
            evidenceType: "number",
            typeFidelity: "precise"
        }]
    },
    properlyFormedEmpty: {
            rows: [],
            columnTypes: [{
                name: "x",
                evidenceType: "number",
                typeFidelity: "precise"
            }]
    },
    extraDataColumn: {
        rows: [{x: 1, y: 2}, {x: 3, y: 4}, {x: 5, y: 6}],
        columnTypes: [{
            name: "x",
            evidenceType: "number",
            typeFidelity: "precise"
        }]
    },
    extraColumnType: {
        rows: [{x: 1}, {x: 3}, {x: 5}],
        columnTypes: [
            { name: "x", evidenceType: "number", typeFidelity: "precise" },
            { name: "y", evidenceType: "number", typeFidelity: "precise" }
        ]
    }
}

describe("QueryResultSchema", () => {
    // Note that this doesn't handle cases that zod should handle natively
    // It targets specifically the refinements applied to validate columns
    it("should handle result sets that have properly formed columnTypes and rows", () => {
        expect(QueryResultSchema.parse(fixtures.properlyFormed)).toEqual(fixtures.properlyFormed)
    })

    it("should handle result sets that have properly formed columnTypes but no rows", () => {
        expect(QueryResultSchema.parse(fixtures.properlyFormedEmpty)).toEqual(fixtures.properlyFormedEmpty)
    })
    
    it("should only validate the types of the first row, ignoring the others", () => {
        let i = 0;
        const fixture = {
            rows: new Array(10).fill({
                /**
                 * Whenever `x` is read (e.g. validated) increment i to track reads
                 */
                get x() {
                    i++
                    return i
                }
            }),
            columnTypes: [
                { name: "x", evidenceType: "number", typeFidelity: "precise" },
            ]
        }
        QueryResultSchema.parse(fixture)
        expect(i).toEqual(1)
        // Ensure that i is actually being incremeneted properly
        fixture.rows.forEach(f => f.x)
        expect(i).toEqual(11)
    })
    
    it("should throw when there is a column in the returned data that is not specified in columnTypes", () => {
        const expectedMessage = JSON.stringify([{"code": "custom","path": ["rows"],"message": "First row of results columns not provided in columnTypes: y"}], null, 2)
        expect(() => QueryResultSchema.parse(fixtures.extraDataColumn)).toThrowError(expectedMessage)
    })
    
    it("should throw when there is a column in columnTypes that does not appear in the returned data", () => {
        const expectedMessage = JSON.stringify([{"code": "custom","path": ["columnTypes"],"message": "Datasource result has columns declared that are missing from results: y"}], null, 2)
        expect(() => QueryResultSchema.parse(fixtures.extraColumnType)).toThrowError(expectedMessage)
    })
})