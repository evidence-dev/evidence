import { describe, it, expect } from 'vitest';
import { extractFilterCreates, extractFilterCreatesFromJs } from './extract-filter-creates';

describe('extractFilterCreates: positive cases', () => {
	it('finds a basic create call with a single string literal id', () => {
		const html = `
			<div id="x"></div>
			<script>
				evidence.filters.create("region", "EU");
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([{ id: 'region' }]);
	});

	it('captures the column option when supplied as a string literal', () => {
		const html = `
			<script>
				evidence.filters.create("region", null, { column: "region_code" });
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([{ id: 'region', column: 'region_code' }]);
	});

	it('handles multiple create calls and preserves source order', () => {
		const html = `
			<script>
				evidence.filters.create("a", null);
				evidence.filters.create("b", "x", { column: "b_col" });
				evidence.filters.create("c", 0);
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([
			{ id: 'a' },
			{ id: 'b', column: 'b_col' },
			{ id: 'c' }
		]);
	});

	it('finds calls inside <script type="module">', () => {
		const html = `
			<script type="module">
				import * as d3 from 'https://esm.sh/d3@7';
				evidence.filters.create("status", null, { column: "status" });
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([{ id: 'status', column: 'status' }]);
	});

	it('parses across multiple <script> blocks in the same body', () => {
		const html = `
			<script>evidence.filters.create("a", null);</script>
			<div></div>
			<script>evidence.filters.create("b", null, { column: "bc" });</script>
		`;
		expect(extractFilterCreates(html)).toEqual([{ id: 'a' }, { id: 'b', column: 'bc' }]);
	});

	it('accepts single quotes, double quotes, and untagged template literals for the id', () => {
		const html = `
			<script>
				evidence.filters.create('a', null);
				evidence.filters.create("b", null);
				evidence.filters.create(\`c\`, null);
			</script>
		`;
		expect(extractFilterCreates(html).map((f) => f.id)).toEqual(['a', 'b', 'c']);
	});

	it('finds calls nested inside other constructs (functions, conditionals, blocks)', () => {
		const html = `
			<script>
				function setup() {
					if (someCond) {
						{
							evidence.filters.create("nested", null, { column: "n" });
						}
					}
				}
				setup();
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([{ id: 'nested', column: 'n' }]);
	});

	it('tolerates top-level await in classic and module scripts', () => {
		const html = `
			<script>
				const rows = await evidence.query("foo");
				evidence.filters.create("bar", null);
			</script>
			<script type="module">
				const rows2 = await evidence.query("baz");
				evidence.filters.create("qux", null);
			</script>
		`;
		expect(extractFilterCreates(html).map((f) => f.id)).toEqual(['bar', 'qux']);
	});

	it('deduplicates by id within a single body (first wins)', () => {
		const html = `
			<script>
				evidence.filters.create("dup", null, { column: "first" });
				evidence.filters.create("dup", null, { column: "second" });
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([{ id: 'dup', column: 'first' }]);
	});
});

describe('extractFilterCreates: negative cases (graceful misses)', () => {
	it('returns empty for an empty body', () => {
		expect(extractFilterCreates('')).toEqual([]);
	});

	it('returns empty for HTML with no scripts', () => {
		expect(extractFilterCreates('<div>just markup</div>')).toEqual([]);
	});

	it('ignores calls whose id is not a string literal (dynamic id)', () => {
		const html = `
			<script>
				const id = "region";
				evidence.filters.create(id, null);
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([]);
	});

	it('ignores template literals with interpolation as the id', () => {
		const html = `
			<script>
				evidence.filters.create(\`region_\${suffix}\`, null);
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([]);
	});

	it('ignores calls on aliased objects (we deliberately match the literal chain)', () => {
		const html = `
			<script>
				const ev = evidence;
				ev.filters.create("region", null);
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([]);
	});

	it('ignores calls with computed member access (evidence["filters"].create)', () => {
		const html = `
			<script>
				evidence["filters"].create("region", null);
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([]);
	});

	it('does not match strings inside a string literal', () => {
		const html = `
			<script>
				const s = "evidence.filters.create('region', null)";
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([]);
	});

	it('does not match references inside a comment', () => {
		const html = `
			<script>
				// evidence.filters.create("region", null);
				/* evidence.filters.create("country", null); */
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([]);
	});

	it('drops a malformed script silently (mid-edit syntax errors are normal)', () => {
		const html = `
			<script>
				evidence.filters.create("ok", null;
			</script>
			<script>
				evidence.filters.create("good", null);
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([{ id: 'good' }]);
	});

	it('drops a column with a non-literal value', () => {
		const html = `
			<script>
				evidence.filters.create("region", null, { column: someVar });
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([{ id: 'region' }]);
	});

	it('skips opts entirely if the third argument is not an object literal', () => {
		const html = `
			<script>
				evidence.filters.create("region", null, getOpts());
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([{ id: 'region' }]);
	});

	it('ignores calls with no arguments (defensive)', () => {
		const html = `
			<script>
				evidence.filters.create();
			</script>
		`;
		expect(extractFilterCreates(html)).toEqual([]);
	});
});

describe('extractFilterCreatesFromJs: pure-JS bodies (custom_map)', () => {
	it('finds create calls in raw JS with no <script> wrapper', () => {
		const js = `
			const map = new mapgl.Map({ container });
			evidence.filters.create('lasso_ids', null, { column: 'id' });
		`;
		expect(extractFilterCreatesFromJs(js)).toEqual([{ id: 'lasso_ids', column: 'id' }]);
	});

	it('captures multiple ids, first-occurrence wins on duplicates', () => {
		const js = `
			evidence.filters.create('a', 1);
			evidence.filters.create('b', 2, { column: 'bcol' });
			evidence.filters.create('a', 3);
		`;
		expect(extractFilterCreatesFromJs(js)).toEqual([{ id: 'a' }, { id: 'b', column: 'bcol' }]);
	});

	it('returns [] for a mid-edit syntax error rather than throwing', () => {
		expect(extractFilterCreatesFromJs('const x = {{{ evidence.filters.create("a")')).toEqual([]);
	});

	it('ignores dynamic (non-literal) ids', () => {
		expect(extractFilterCreatesFromJs('evidence.filters.create(someVar, 1)')).toEqual([]);
	});

	it('returns [] when the source never mentions evidence', () => {
		expect(extractFilterCreatesFromJs('const m = new mapgl.Map({ container });')).toEqual([]);
	});
});
