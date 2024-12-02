const STANDARD = `
\`\`\`myquery
SELECT 1 as blah
\`\`\`
`;

const REFERENTIAL = `
\`\`\`myquery
SELECT 1 as blah
\`\`\`

\`\`\`referential
SELECT * FROM \${myquery}
\`\`\`
`;

const CIRCULAR = `
\`\`\`myquery
SELECT * FROM \${referential}
\`\`\`

\`\`\`referential
SELECT * FROM \${myquery}
\`\`\`
`;

const SELF_REFERENTIAL = `
\`\`\`myquery
SELECT * FROM \${myquery}
\`\`\`
`;

const HAS_SPECIAL_STRING_PROTOTYPE_REPLACE_SEQUENCE = `
\`\`\`read_string
SELECT 'evi.+e$' as str
\`\`\`

\`\`\`myquery
SELECT * FROM \${read_string}
\`\`\`
`;

module.exports = {
	STANDARD,
	REFERENTIAL,
	CIRCULAR,
	SELF_REFERENTIAL,
	HAS_SPECIAL_STRING_PROTOTYPE_REPLACE_SEQUENCE
};
