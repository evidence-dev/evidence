const NO_QUERY = `
# This is a markdown!
`;

const NOT_QUITE_A_QUERY = `
\`\`almost
SELECT false
\`\`\`
`;

const REAL_CODE = `
\`\`\`javascript
console.log("🧂")
\`\`\`
`;

const INDENTED_CODE = `
    {
        "x": "y"
    }
`;

const INDENTED_QUERY = `
    SELECT 1;
`;

const ONE_QUERY = `
\`\`\`someQuery
SELECT 1;
\`\`\`

# This is a markdown!

<BoxPlot data={someQuery}/>
`;

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
`;

module.exports = {
	NO_QUERY,
	NOT_QUITE_A_QUERY,
	REAL_CODE,
	INDENTED_CODE,
	INDENTED_QUERY,
	ONE_QUERY,
	TWO_QUERIES
};
