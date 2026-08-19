import { describe, it, expect } from 'vitest';
import { process } from './process';
import type {
	QueryService,
	QueryResult,
	AnyRowType
} from '@evidence/core/user-components/interfaces/query-service';
import { ClickHouseDialect } from '@evidence/core/sql-dialect';

/** Records the SQL it receives and answers DESCRIBE with a single `n` column. */
function fakeQueryService(executed: string[]): QueryService {
	return {
		workspaceId: 'test',
		connectionType: 'managed',
		dialect: new ClickHouseDialect(),
		async query<RowType extends AnyRowType = AnyRowType>(
			sql: string
		): Promise<QueryResult<RowType>> {
			executed.push(sql);
			return {
				// Introspection issues `DESCRIBE TABLE (...)` and reads the rows.
				rows: [{ name: 'n', type: 'UInt64' }] as unknown as RowType[],
				columns: [
					{ name: 'name', clickhouseType: 'String', jsType: 'string' },
					{ name: 'type', clickhouseType: 'String', jsType: 'string' }
				],
				error: null
			};
		}
	};
}

const PAGE_WITH_FILTERED_QUERY = `
{% dropdown id="org" data="orgs" value_column="org_id" /%}

\`\`\`sql org_kpis
select count(*) as n from page_views
where 1 = 1 [[ and organization_id = {{org}} ]]
\`\`\`

\`\`\`sql plain_kpis
select count(*) as n from page_views
\`\`\`

{% big_value data="org_kpis" value="sum(n)" /%}
{% big_value data="plain_kpis" value="sum(n)" /%}
`;

describe('process: filter pre-registration for inline query introspection', () => {
	it('resolves {{filter_id}} in sql blocks instead of erroring with Missing filter ID', async () => {
		const executed: string[] = [];
		const result = await process(PAGE_WITH_FILTERED_QUERY, {
			queryService: fakeQueryService(executed)
		});

		// Pre-registration makes {{org}} resolve against the page's dropdown.
		// The empty filter means the filtered block is skipped (it re-introspects
		// once a value is set), so the page must produce no false errors at all.
		const messages = result.validationErrors.map((e) => e.error?.message ?? '');
		expect(messages.join('\n')).not.toContain('Missing filter ID');
		expect(messages.join('\n')).not.toContain('does not exist');

		// Blocks without filter references still introspect normally.
		expect(executed.some((sql) => sql.includes('page_views'))).toBe(true);
	});

	it('registers filters declared with unquoted variable attributes', async () => {
		// `title={{$page_title}}` only tokenizes as a valid tag after
		// preprocessVariables — pre-registration must preprocess like core's parse.
		const executed: string[] = [];
		const page = `---
page_title: Customers
---

{% dropdown id="org" data="orgs" value_column="org_id" title={{$page_title}} /%}

\`\`\`sql org_kpis
select count(*) as n from page_views
where 1 = 1 [[ and organization_id = {{org}} ]]
\`\`\`

{% big_value data="org_kpis" value="sum(n)" /%}
`;
		const result = await process(page, { queryService: fakeQueryService(executed) });

		const messages = result.validationErrors.map((e) => e.error?.message ?? '');
		expect(messages.join('\n')).not.toContain('Missing filter ID');
		expect(messages.join('\n')).not.toContain('does not exist');
	});

	it('still reports a missing filter when no component defines it', async () => {
		const executed: string[] = [];
		const page = `
\`\`\`sql broken
select count(*) as n from page_views where organization_id = {{nonexistent}}
\`\`\`

{% big_value data="broken" value="sum(n)" /%}
`;
		const result = await process(page, { queryService: fakeQueryService(executed) });

		const messages = result.validationErrors.map((e) => e.error?.message ?? '');
		expect(messages.join('\n')).toContain('Missing filter ID');
	});
});
