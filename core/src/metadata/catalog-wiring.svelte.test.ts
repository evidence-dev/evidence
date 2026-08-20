// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Fixture from './catalog-wiring.fixture.svelte';
import { SnowflakeDialect } from '../sql-dialect';
import type { QueryService } from '../user-components/interfaces/query-service';
import type { Metadata } from './Metadata.svelte';
import type { Connection } from '../connection/types';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
});

describe('setMetadataContext catalog wiring', () => {
	// Guards #1928's runtime mechanism: after a layout registers the query service and then
	// the metadata, a nested component must resolve a connection whose `catalog` is that same
	// Metadata — without losing the native dialect the enhanced connection still delegates.
	it('a nested consumer resolves the connection with the attached catalog and live dialect', () => {
		const queryService = {
			workspaceId: 'workspace',
			connectionType: 'snowflake',
			dialect: new SnowflakeDialect(),
			query: vi.fn()
		} as unknown as QueryService;
		const metadata = { tables: [] } as unknown as Metadata;

		let resolved: Connection | undefined;
		target = document.createElement('div');
		document.body.appendChild(target);
		mounted = mount(Fixture, {
			target,
			props: {
				queryService,
				metadata,
				onResolved: (connection: Connection) => {
					resolved = connection;
				}
			}
		});
		flushSync();

		expect(resolved).toBeDefined();
		// The catalog attached by setMetadataContext is the exact Metadata instance.
		expect(resolved!.catalog).toBe(metadata);
		// The dialect still flows through the catalog-enhanced connection.
		expect(resolved!.type).toBe('snowflake');
		expect(resolved!.dialect).toBeInstanceOf(SnowflakeDialect);
	});
});
