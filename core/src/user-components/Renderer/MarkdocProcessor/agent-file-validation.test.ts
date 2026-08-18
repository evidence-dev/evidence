import { describe, it, expect } from 'vitest';
import { parse, validate } from './process-markdoc';
import type { ValidationContext } from '../../validators';

/** The frontmatter rules only read `useRelativeResolution` + `basePath`. */
const contextFor = (basePath: string) =>
	({ useRelativeResolution: true, basePath }) as unknown as ValidationContext;

/** A well-formed skill file: `name` and `description` are both REQUIRED here. */
const SKILL = `---
name: sales-context
description: How to talk about sales numbers.
---

Use net revenue, not gross.
`;

const messagesFor = (content: string, basePath: string) =>
	validate(parse(content), contextFor(basePath)).map((e) => e.error.message);

describe('agent/ files are exempt from page frontmatter rules', () => {
	it('does not tell a skill file to replace `name` with `title`', () => {
		expect(messagesFor(SKILL, 'agent/skills/sales-context/SKILL.md')).toEqual([]);
	});

	it('exempts agent/context files too', () => {
		expect(messagesFor(SKILL, 'agent/context/glossary.md')).toEqual([]);
	});

	it('still warns about `name` on a real page', () => {
		expect(messagesFor(SKILL, 'pages/home')).toContain(
			'name is optional and can be removed; use title instead'
		);
	});
});
