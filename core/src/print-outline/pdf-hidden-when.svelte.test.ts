// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Fixture from './pdf-hidden-when.fixture.svelte';
import { ClickHouseDialect } from '../sql-dialect';
import type { QueryService } from '../user-components/interfaces/query-service';
import { encodeIterationChain } from './section-key';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
});

const queryService = {
	workspaceId: 'workspace',
	connectionType: 'managed',
	dialect: new ClickHouseDialect(),
	query: vi.fn().mockResolvedValue({ rows: [], columns: [], error: null })
} as unknown as QueryService;

const chain = (value: string) => encodeIterationChain([{ id: 'region', value }]);

function render(notesHiddenIn: string[]) {
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(Fixture, { target, props: { queryService, notesHiddenIn } });
	flushSync();
	return (selector: string) => !!target!.querySelector(selector)?.closest('[data-pdf-hidden]');
}

describe('PdfHiddenWhen', () => {
	it('hides a heading section in the matching repeat iteration only', () => {
		const isHidden = render([chain('East')]);
		expect(isHidden('[data-notes="East"]')).toBe(true);
		expect(isHidden('[data-region="East"]')).toBe(false);
		expect(isHidden('[data-notes="West"]')).toBe(false);
	});
});
