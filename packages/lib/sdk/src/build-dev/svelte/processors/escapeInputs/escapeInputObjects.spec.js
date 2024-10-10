import { describe, expect, it } from 'vitest';
import { escapeInputObjects } from './escapeInputObjects.js';

const testStr = (str) => escapeInputObjects().markup({ content: str, filename: '+page.md' }).code;
const subStr = '[ToMarkdown]';

describe('escapeInputObjects', () => {
	// 🚩 There are many test cases we should care about here
	// - Basic Usage
	// - Deep Usage
	// - Optional Usage
	// - Optional Deep Usage
	// - All of the above in a ternary
	// - .toLowerCase() and other primitive functions (e.g. .toFixed())
	// - in a non-string interpolated attribute
	it('should an insertion on {inputs.something}', () => {
		expect(testStr('{inputs.something}')).toBe(`{inputs.something${subStr}}`);
	});
	
	it('should an insertion on {inputs.something.somethingelse}', () => {
		expect(testStr('{inputs.something.somethingelse}')).toBe(
			`{inputs.something.somethingelse${subStr}}`
		);
	});
	
	it('should not do an insertion on {inputs}', () => {
		expect(testStr('{inputs}')).toBe('{inputs}');
	});
	
	it('should do an insertion on {inputs?.something}', () => {
		expect(testStr('{inputs?.something}')).toBe(`{inputs?.something${subStr}}`);
	});
	
	it('should do an insertion on {inputs.something?.somethingelse}', () => {
		expect(testStr('{inputs.something?.somethingelse}')).toBe(
			`{inputs.something?.somethingelse${subStr}}`
		);
	});
	
	it('should not do an insertion on <Component attr={inputs.something} />', () => {
		expect(testStr('<Component attr={inputs.something} />')).toBe(
			'<Component attr={inputs.something} />'
		);
	});
	
	it('should do an insertion on <Component attr="string interpolation {inputs.something}" />', () => {
		expect(testStr('<Component attr="string interpolation {inputs.something}" />')).toBe(
			`<Component attr="string interpolation {inputs.something${subStr}}" />`
		);
	});
	
	it('should do an insertion on <Component attr={inputs.something + 5} />', () => {
		expect(testStr('<Component attr={inputs.something + 5} />')).toBe(
			`<Component attr={inputs.something${subStr} + 5} />`
		);
	});
	
	it('should do nothing on <Component attr />', () => {
		expect(testStr('<Component attr />')).toBe(`<Component attr />`);
	});
	
	it('should do an insertion on { inputs.something }', () => {
		expect(testStr('{ inputs.something }')).toBe(`{ inputs.something${subStr} }`);
	});
	
	it('should do an insertion on { inputs.something ? true : false }', () => {
		expect(testStr('{ inputs.something ? true : false }')).toBe(
			`{ inputs.something${subStr} ? true : false }`
		);
	});
	
	it('should (?) do an insertion on {inputs.something.toLowerCase()}', () => {
		expect(testStr('{inputs.something.toLowerCase()}')).toBe(`{inputs.something.toLowerCase()}`);
	});

	it('should do an insertion on the first occurence of inputs in { inputs.something ? inputs.something.toLowerCase() : false }', () => {
		expect(testStr('{ inputs.something ? inputs.something.toLowerCase() : false }')).toBe(
			`{ inputs.something${subStr} ? inputs.something.toLowerCase() : false }`
		);
	});

	it('should do nothing with a script tag', () => {
		expect(testStr('<script>inputs.something</script>')).toBe('<script>inputs.something</script>');
	});

	it('should tag ternary comparitors with [TernaryEscape]', () => {

	});
});
