const { highlighter } = require('./highlighter.cjs');

describe('highlighter', () => {
	it("should output a query viewer for an 'unknown' language", () => {
		const result = highlighter('SELECT 1;', 'my_query_id');
		expect(result).toMatch(/<QueryViewer/);
		expect(result).toMatch(/queryID = "my_query_id"/);
	});
	it('should output a code block for a known language', () => {
		const result = highlighter('console.log(1);', 'javascript');
		expect(result).toMatch(/<CodeBlock/);
		expect(result).toMatch(/source="console.log\(1\);"/);
	});
	it('should output a query viewer for the sql language when provided with meta', () => {
		const result = highlighter('SELECT 1;', 'sql', 'my_query_id');
		expect(result).toMatch(/<QueryViewer/);
		expect(result).toMatch(/queryID = "my_query_id"/);
		expect(result).toMatch(/queryResult = {data.my_query_id}/);
	});
	it('should output a code block for a sql block without a query id', () => {
		const result = highlighter('SELECT 1;', 'sql');
		expect(result).toMatch(/<CodeBlock/);
		expect(result).toMatch(/source="SELECT 1;"/);
	});
	it('should be case insensitive for languages', () => {
		const result = highlighter('console.log(1);', 'JavAScripT');
		expect(result).toMatch(/<CodeBlock/);
		expect(result).toMatch(/source="console.log\(1\);"/);
	});
});
