const {getQueryIds} = require("./get-query-ids.cjs")

const NO_QUERY = `
# This is a markdown!
`

const NOT_QUITE_A_QUERY = `
\`\`almost
SELECT false
\`\`\`
`

const REAL_CODE = `
\`\`\`javascript
console.log("🧂")
\`\`\`
`

const INDENTED_CODE = `
    {
        "x": "y"
    }
`

const INDENTED_QUERY = `
    SELECT 1;
`

const ONE_QUERY =`
\`\`\`someQuery
SELECT 1;
\`\`\`

# This is a markdown!

<BoxPlot data={someQuery}/>
`

const TWO_QUERIES = `
\`\`\`someQuery
SELECT 1;
\`\`\`

\`\`\`someOtherQuery
SELECT 1;
\`\`\`

# This is a markdown!

<BoxPlot data={someQuery}/>
<BoxPlot data={someOtherQuery}/>
`

describe("getQueryIds", () => {
    it("should return empty for no queries", () => {
        expect(getQueryIds(NO_QUERY)).toEqual([])
    })
    it("should return an array for 1 query", () => {
        expect(getQueryIds(ONE_QUERY)).toEqual(['someQuery'])
    })
    it("should return an array for 2 queries", () => {
        expect(getQueryIds(TWO_QUERIES)).toEqual(['someQuery','someOtherQuery'])
    })
    it("should return empty for an improperly formed query", () => {
        // TODO: This test case is failing, is that something that we need to worry about?
        expect(getQueryIds(NOT_QUITE_A_QUERY)).toEqual([])
    })
    it("should ignore \"real\" code blocks", () => {
        expect(getQueryIds(REAL_CODE)).toEqual([])
    })
    it("should ignore indented code blocks", () => {
        expect(getQueryIds(INDENTED_CODE)).toEqual([])
    })
    it("should ignore indented queries", () => {
        expect(getQueryIds(INDENTED_QUERY)).toEqual([])
    })
})