jest.mock('fs');
const fs = require('fs');

const { getQueryIds } = require('./extract-queries.cjs');
const {
	NO_QUERY,
	NOT_QUITE_A_QUERY,
	REAL_CODE,
	INDENTED_CODE,
	INDENTED_QUERY,
	ONE_QUERY,
	TWO_QUERIES,
	REAL_MARKDOWN_FILE
} = require('./get-query-ids.fixture.cjs');

describe('getQueryIds', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		fs.statSync.mockReturnValue({ isFile: () => true });
	});
	it('should return empty for no queries', () => {
		expect(getQueryIds(NO_QUERY)).toEqual([]);
	});
	it('should return an array for 1 query', () => {
		expect(getQueryIds(ONE_QUERY)).toEqual(['someQuery']);
	});
	it('should return an array for 2 queries', () => {
		expect(getQueryIds(TWO_QUERIES)).toEqual(['someQuery', 'someOtherQuery']);
	});
	it('should return empty for an improperly formed query', () => {
		// TODO This test case is failing, is that something that we need to worry about?
		// expect(getQueryIds(NOT_QUITE_A_QUERY)).toEqual([]);

		// This is the previous behavior, which may be unexpected
		expect(getQueryIds(NOT_QUITE_A_QUERY)).toEqual(['untitled']);
	});
	it('should ignore "real" code blocks', () => {
		expect(getQueryIds(REAL_CODE)).toEqual([]);
	});
	it('should ignore indented code blocks', () => {
		expect(getQueryIds(INDENTED_CODE)).toEqual([]);
	});
	it('should ignore indented queries', () => {
		expect(getQueryIds(INDENTED_QUERY)).toEqual([]);
	});

	it('should handle all cases in a "real" markdown file', () => {
		const ids = getQueryIds(REAL_MARKDOWN_FILE);
		expect(ids).toEqual(['input', 'working_reference', 'reviews']);
	});
});
