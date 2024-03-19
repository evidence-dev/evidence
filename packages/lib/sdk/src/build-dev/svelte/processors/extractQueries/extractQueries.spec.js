import { describe, it, expect, beforeEach } from 'vitest';
import { extractQueries } from './extractQueries.js';
import { clearFileMetadatas, getFileMetadata } from '../../metadatas.js';

describe('extractQueries', () => {
	beforeEach(() => {
		clearFileMetadatas();
	});
	it('Should extract a single query', () => {
		const queryContent = `SELECT * FROM users`;
		const filename = `+page.svelte`;
		const content = `<code lang="sql" evidence-query-name="simple_query">${queryContent}</code>`;

		extractQueries.markup({ filename, content });
		expect(getFileMetadata(filename).queries).toHaveProperty('simple_query');
		expect(getFileMetadata(filename).queries.simple_query).toEqual(queryContent);
	});
	it('Should infer sql lang when query name is present', () => {
		const queryContent = `SELECT * FROM users`;
		const filename = `+page.svelte`;
		const content = `<code evidence-query-name="simple_query">${queryContent}</code>`;

		extractQueries.markup({ filename, content });
		expect(getFileMetadata(filename).queries).toHaveProperty('simple_query');
		expect(getFileMetadata(filename).queries.simple_query).toEqual(queryContent);
	});
	it('Should extract multiple queries', () => {
		const queryContent = [`SELECT * FROM users`, `SELECT * FROM posts`];
		const filename = `+page.svelte`;
		const content = queryContent
			.map(
				(q, i) => `
        <code lang="sql" evidence-query-name="simple_query_${i}">${q}</code>
        `
			)
			.join('\n');

		extractQueries.markup({ filename, content });
		let i = 0;
		for (const query of queryContent) {
			expect(getFileMetadata(filename).queries).toHaveProperty(`simple_query_${i}`);
			expect(getFileMetadata(filename).queries[`simple_query_${i}`]).toEqual(query);
			i++;
		}
	});
	it('Should ignore code blocks without a query name', () => {
		const queryContent = `SELECT * FROM users`;
		const filename = `+page.svelte`;
		const content = `<code lang="sql">${queryContent}</code>`;

		extractQueries.markup({ filename, content });
		expect(getFileMetadata(filename).queries).not.toHaveProperty('simple_query');
	});
});
