import { describe, it, expect } from 'vitest';
import { obfuscateCode } from './obfuscateCode.js';

describe('obfusctateCode', () => {
	it('Should b64 encode basic javascript', () => {
		const r = obfuscateCode.markup({
			content: `<code lang="javascript">
console.log()
</code>`
		});
		expect(r.code).toEqual(`<code lang="javascript">{@html atob(\`Y29uc29sZS5sb2coKQ==\`)}</code>`);
	});
	it('Should b64 encode basic SQL', () => {
		const r = obfuscateCode.markup({
			content: `<code lang="sql">
            SELECT * FROM 5
            </code>`
		});
		expect(r.code).toEqual(`<code lang="sql">{@html atob(\`U0VMRUNUICogRlJPTSA1\`)}</code>`);
	});
});
