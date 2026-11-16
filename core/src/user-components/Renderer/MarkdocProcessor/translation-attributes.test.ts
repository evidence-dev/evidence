import { describe, expect, test } from 'vitest';
import Markdoc, { type RenderableTreeNode, type Tag } from '@markdoc/markdoc';
import { process } from './process-markdoc';
import { hasUnresolvedTranslationSqlEscape } from '../../../translations/translation-value';

const translations = { revenue: "Chiffre d'affaires", region: 'Région' };

function findTags(tree: RenderableTreeNode, name: string): Tag[] {
	if (!Markdoc.Tag.isTag(tree)) return [];
	const own = tree.name === name ? [tree] : [];
	return [...own, ...tree.children.flatMap((child) => findTags(child, name))];
}

const render = (markdown: string) => process(markdown, undefined, undefined, translations).tree;

const QUERY = "```sql sales\nselect 1 as revenue, 'a' as region\n```\n\n";

describe('$translations in component attributes', () => {
	test.each([
		['big_value', '{% big_value data="sales" value="sum(revenue)" title=$translations.revenue /%}'],
		[
			'bar_chart',
			'{% bar_chart data="sales" x="region" y="sum(revenue)" title=$translations.revenue /%}'
		],
		[
			'dropdown',
			'{% dropdown id="r" data="sales" value_column="region" title=$translations.revenue /%}'
		]
	])('%s title resolves to the plain translated string', (tag, markup) => {
		const [node] = findTags(render(QUERY + markup), tag);
		expect(node.attributes.title).toBe("Chiffre d'affaires");
	});

	test('table, dimension and measure titles resolve inside a table', () => {
		const tree = render(
			QUERY +
				`{% table data="sales" title=$translations.revenue %}
  {% dimension value="region" title=$translations.region /%}
  {% measure value="sum(revenue)" title=$translations.revenue /%}
{% /table %}`
		);
		expect(findTags(tree, 'table')[0].attributes.title).toBe("Chiffre d'affaires");
		expect(findTags(tree, 'dimension')[0].attributes.title).toBe('Région');
		expect(findTags(tree, 'measure')[0].attributes.title).toBe("Chiffre d'affaires");
	});

	test('zod-typed attributes receive plain strings', () => {
		const tree = render(
			QUERY +
				'{% bar_chart data="sales" x="region" y="sum(revenue)" series_order=[$translations.region, "b"] /%}'
		);
		expect(findTags(tree, 'bar_chart')[0].attributes.series_order).toEqual(['Région', 'b']);
	});

	test('the .sql accessor still resolves to its deferred-escape sentinel', () => {
		const tree = render(
			QUERY + '{% big_value data="sales" value="sum(revenue)" title=$translations.revenue.sql /%}'
		);
		const title = findTags(tree, 'big_value')[0].attributes.title;
		expect(typeof title).toBe('string');
		expect(hasUnresolvedTranslationSqlEscape(title)).toBe(true);
	});

	test('inline text references still render the translated string', () => {
		expect(JSON.stringify(render('# {% $translations.revenue %}'))).toContain("Chiffre d'affaires");
	});
});
