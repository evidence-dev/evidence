import { describe, it, expect } from 'vitest';
import { connectionErrorFor } from './enforcement';
import { InlineQueries } from '../user-components/common/inline-queries';

function withConnections(names: string[]): InlineQueries {
	const iq = new InlineQueries({ filterContexts: undefined }, {});
	iq.setConnectionNames(names);
	return iq;
}

describe('connectionErrorFor', () => {
	it('returns undefined when no connection is referenced', () => {
		expect(connectionErrorFor(undefined, withConnections(['default']))).toBeUndefined();
	});

	it('returns undefined for a registered connection', () => {
		expect(connectionErrorFor('snowflake', withConnections(['default', 'snowflake']))).toBeUndefined();
	});

	it('errors for a referenced connection that is not registered', () => {
		expect(connectionErrorFor('snowflke', withConnections(['default', 'snowflake']))).toContain(
			'snowflke'
		);
	});

	it('stands down entirely when no connection names are registered (dormant / CLI)', () => {
		expect(connectionErrorFor('anything', withConnections([]))).toBeUndefined();
		expect(connectionErrorFor('anything', undefined)).toBeUndefined();
	});
});
