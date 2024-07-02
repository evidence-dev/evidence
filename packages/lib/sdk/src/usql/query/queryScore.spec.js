import { describe, expect, it } from 'vitest';
import { getQueryScore } from './queryScore';

describe('queryScore', () => {
	it('should return 8 for a Query with a single boolean column, and 1 row', async () => {
		const cols = [{ column_name: 'bool_col', column_type: 'BOOLEAN' }];
		const len = 1;

		const result = getQueryScore(len, cols);

		expect(result).toBe(8);
	});
	it('should return x for a Query with 5 string columms, and 5 rows', async () => {
		const cols = [
			{ column_name: 'var_char_col1', column_type: 'VARCHAR' },
			{ column_name: 'var_char_col2', column_type: 'VARCHAR' },
			{ column_name: 'var_char_col3', column_type: 'VARCHAR' },
			{ column_name: 'var_char_col4', column_type: 'VARCHAR' },
			{ column_name: 'var_char_col5', column_type: 'VARCHAR' }
		];
		const len = 5;
		const result = getQueryScore(len, cols);

		expect(result).toBe(850);
	});
});
