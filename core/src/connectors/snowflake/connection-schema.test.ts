import { describe, expect, it } from 'vitest';
import { snowflakeBase } from './connection-schema';

describe('snowflake account locator', () => {
	it('accepts valid locator characters and normalizes underscores', () => {
		expect(snowflakeBase.shape.account.parse('  org_name.account-1  ')).toBe(
			'org-name.account-1'
		);
	});

	it.each(['evil-target/somepath', 'acct?x=1', 'acct#fragment'])(
		'rejects URL delimiter payload %s',
		(account) => {
			const result = snowflakeBase.shape.account.safeParse(account);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toBe(
					'Account locator can only contain alphanumeric characters, hyphens, underscores, and periods.'
				);
			}
		}
	);
});
