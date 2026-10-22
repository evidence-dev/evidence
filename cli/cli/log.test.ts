import { describe, it, expect } from 'vitest';
import { codeBox } from './log.ts';

describe('codeBox', () => {
	it('frames the code with edges that line up', () => {
		const lines = codeBox('WXYZ-1234').split('\n');
		expect(lines).toEqual(['  ┌─────────────┐', '  │  WXYZ-1234  │', '  └─────────────┘']);
		expect(new Set(lines.map((l) => l.length)).size).toBe(1);
	});
});
