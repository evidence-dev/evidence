import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { projectRootPageFrontmatterSchema } from './page-frontmatter-schema';

const downIsGood = (frontmatter: string) =>
	projectRootPageFrontmatterSchema.parse(yaml.load(frontmatter)).down_is_good;

describe('down_is_good frontmatter', () => {
	it.each([
		['down_is_good: true', true],
		['down_is_good: false', false],
		['down_is_good: "false"', false],
		["down_is_good: 'true'", true],
		['down_is_good: "TRUE"', true],
		['down_is_good: yes', undefined],
		['down_is_good: 1', undefined],
		['title: Costs', undefined]
	])('%s → %s', (frontmatter, expected) => {
		expect(downIsGood(frontmatter)).toBe(expected);
	});
});
