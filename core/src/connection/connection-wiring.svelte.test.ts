// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Fixture from './connection-wiring.fixture.svelte';
import { SnowflakeDialect } from '../sql-dialect';
import type { QueryService } from '../user-components/interfaces/query-service';
import type { Connection } from './types';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
});

describe('setQueryService → getDefaultConnection wiring', () => {
	// Guards the exact multi-connection-prep residual: the real ancestor-sets / descendant-reads
	// Svelte-context flow (a layout registers the registry-of-one; a nested component resolves it)
	// must surface a connection carrying the query service's own native dialect — not a ClickHouse
	// fallback.
	it('a nested consumer resolves a connection carrying the query service native dialect', () => {
		const query = vi.fn().mockResolvedValue({ rows: [], columns: [], error: null });
		const queryService = {
			workspaceId: 'workspace',
			connectionType: 'snowflake',
			dialect: new SnowflakeDialect(),
			query
		} as unknown as QueryService;

		let resolved: Connection | undefined;
		target = document.createElement('div');
		document.body.appendChild(target);
		mounted = mount(Fixture, {
			target,
			props: {
				queryService,
				onResolved: (connection: Connection) => {
					resolved = connection;
				}
			}
		});
		flushSync();

		expect(resolved).toBeDefined();
		expect(resolved!.id).toBe('default');
		expect(resolved!.type).toBe('snowflake');
		expect(resolved!.dialect).toBeInstanceOf(SnowflakeDialect);

		void resolved!.query('SELECT 1');
		expect(query).toHaveBeenCalledWith('SELECT 1', undefined);
	});
});
