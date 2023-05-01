jest.mock('fs');

const { parseFrontmatter } = require('./parse-frontmatter.cjs');
const fs = require('fs');
const {
	emptyFrontmatter,
	missingFrontmatter,
	basicFrontmatter,
	complexFrontmatter,
	extraFrontmatter,
	frontmatterWithMarkdownTable,
	markdownTableWithoutFrontmatter,
	frontmatterWithTitle,
	frontmatterWithTitleHidden
} = require('./parse-frontmatter.fixture.cjs');

fs.statSync.mockReturnValue({ isFile: () => true });

describe('Parse frontmatter', () => {
	it('Should return undefined for missing frontmatter', async () => {
		const result = await parseFrontmatter(missingFrontmatter);
		expect(result).toBeUndefined();
	});
	it('Should extract an empty frontmatter', async () => {
		const result = await parseFrontmatter(emptyFrontmatter);
		expect(result).toEqual({});
	});
	it('Should return an object with frontmatter keys (Complex)', async () => {
		const result = await parseFrontmatter(complexFrontmatter);
		expect(result).toEqual({
			title: 'Hello!',
			multiline: 'This\nis\nmultiline\n',
			array: [1, 2, 'three', { nested: 'object' }],
			object: { some: 'key', nested: { some: 'key' } }
		});
	});
	it('Should return an object with frontmatter keys (Basic)', async () => {
		const result = await parseFrontmatter(basicFrontmatter);
		expect(result).toEqual({ title: 'Hi!' });
	});
	it('Should only parse the first frontmatter block', async () => {
		const result = await parseFrontmatter(extraFrontmatter);
		expect(result).toEqual({ title: 'This is the correct frontmatter' });
	});
	it('Should extract frontmatter when there is a markdown table on the page, along with frontmatter', async () => {
		const result = await parseFrontmatter(frontmatterWithMarkdownTable);
		expect(result).toEqual({ title: 'Hello!' });
	});
	it('Should extract nothing when there is a markdown table on the page, but no frontmatter', async () => {
		const result = await parseFrontmatter(markdownTableWithoutFrontmatter);
		expect(result).toBeUndefined();
	});
	it('Should display a title only', async () => {
		const result = await parseFrontmatter(frontmatterWithTitle);
		expect(result).toEqual({ title: 'Hello!' });
	});
	it('Should display a title and hide_title property', async () => {
		const result = await parseFrontmatter(frontmatterWithTitleHidden);
		expect(result).toEqual({ title: 'Hello!', hide_title: true });
	});
});
