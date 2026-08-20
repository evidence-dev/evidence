import { describe, it, expect } from 'vitest';
import { preprocessVariables } from './preprocess-variables';

describe('preprocessVariables', () => {
	describe('basic variable quoting', () => {
		it('should quote unquoted filter variables', () => {
			const input = '{% toggle id="tog" hide={{toggle.value}} /%}';
			const expected = '{% toggle id="tog" hide="{{toggle.value}}" /%}';
			expect(preprocessVariables(input)).toBe(expected);
		});

		it('should quote unquoted frontmatter variables', () => {
			const input = '{% measure value="sum(x)" hide={{$show_col}} /%}';
			const expected = '{% measure value="sum(x)" hide="{{$show_col}}" /%}';
			expect(preprocessVariables(input)).toBe(expected);
		});

		it('should quote variables without $ prefix', () => {
			const input = '{% chart y={{my_var}} /%}';
			const expected = '{% chart y="{{my_var}}" /%}';
			expect(preprocessVariables(input)).toBe(expected);
		});

		it('should handle multiple unquoted variables in one tag', () => {
			const input = '{% component x={{var1}} y={{var2}} /%}';
			const expected = '{% component x="{{var1}}" y="{{var2}}" /%}';
			expect(preprocessVariables(input)).toBe(expected);
		});
	});

	describe('already quoted variables', () => {
		it('should not double-quote already quoted variables', () => {
			const input = '{% toggle hide="{{toggle.value}}" /%}';
			expect(preprocessVariables(input)).toBe(input);
		});

		it('should not quote variables in the middle of strings', () => {
			const input = '{% component title="Sales for {{category}}" /%}';
			expect(preprocessVariables(input)).toBe(input);
		});

		it('should handle single-quoted strings', () => {
			const input = "{% component title='Sales for {{category}}' /%}";
			expect(preprocessVariables(input)).toBe(input);
		});

		it('should handle mixed quoted and unquoted', () => {
			const input = '{% component title="{{var1}}" hide={{var2}} /%}';
			const expected = '{% component title="{{var1}}" hide="{{var2}}" /%}';
			expect(preprocessVariables(input)).toBe(expected);
		});
	});

	describe('code blocks', () => {
		it('should not process variables inside code blocks', () => {
			const input = `\`\`\`sql
SELECT {{column}} FROM table
WHERE x={{value}}
\`\`\``;
			expect(preprocessVariables(input)).toBe(input);
		});

		it('should process before and after code blocks', () => {
			const input = `{% toggle hide={{var1}} /%}

\`\`\`sql
SELECT {{column}}
\`\`\`

{% toggle hide={{var2}} /%}`;
			const expected = `{% toggle hide="{{var1}}" /%}

\`\`\`sql
SELECT {{column}}
\`\`\`

{% toggle hide="{{var2}}" /%}`;
			expect(preprocessVariables(input)).toBe(expected);
		});

		it('should handle tilde code fences', () => {
			const input = `~~~sql
SELECT {{column}}
~~~`;
			expect(preprocessVariables(input)).toBe(input);
		});
	});

	describe('regular markdown text', () => {
		it('should not process variables in paragraph text', () => {
			const input = 'This is text with {{variable}} in it.';
			expect(preprocessVariables(input)).toBe(input);
		});

		it('should not process variables in headings', () => {
			const input = '# Title with {{variable}}';
			expect(preprocessVariables(input)).toBe(input);
		});

		it('should only process component tags', () => {
			const input = `# Sales Report {{year}}

{% chart y={{revenue}} /%}

The total revenue was {{total}}.`;
			const expected = `# Sales Report {{year}}

{% chart y="{{revenue}}" /%}

The total revenue was {{total}}.`;
			expect(preprocessVariables(input)).toBe(expected);
		});
	});

	describe('multi-line tags', () => {
		it('should handle tags split across lines', () => {
			const input = `{% component
    x={{var1}}
    y={{var2}}
/%}`;
			const expected = `{% component
    x="{{var1}}"
    y="{{var2}}"
/%}`;
			expect(preprocessVariables(input)).toBe(expected);
		});
	});

	describe('edge cases', () => {
		it('should handle empty input', () => {
			expect(preprocessVariables('')).toBe('');
		});

		it('should handle input with no variables', () => {
			const input = '{% toggle id="tog" hide=false /%}';
			expect(preprocessVariables(input)).toBe(input);
		});

		it('should handle complex variable expressions', () => {
			const input = '{% component value={{filter.selected.value}} /%}';
			const expected = '{% component value="{{filter.selected.value}}" /%}';
			expect(preprocessVariables(input)).toBe(expected);
		});

		it('should handle pipe fallback syntax', () => {
			const input = '{% component title={{myvar | "default"}} count={{num | 0}} /%}';
			const expected = '{% component title="{{myvar | "default"}}" count="{{num | 0}}" /%}';
			expect(preprocessVariables(input)).toBe(expected);
		});

		it('should handle attributes with underscores and hyphens', () => {
			const input = '{% component my_attr={{var}} data-val={{var2}} /%}';
			const expected = '{% component my_attr="{{var}}" data-val="{{var2}}" /%}';
			expect(preprocessVariables(input)).toBe(expected);
		});
	});

	describe('nested and complex scenarios', () => {
		it('should handle nested components', () => {
			const input = `{% table data="sales" %}
    {% measure value="sum(x)" hide={{toggle.value}} /%}
{% /table %}`;
			const expected = `{% table data="sales" %}
    {% measure value="sum(x)" hide="{{toggle.value}}" /%}
{% /table %}`;
			expect(preprocessVariables(input)).toBe(expected);
		});

		it('should handle variables inside object literals', () => {
			const input = `{% combo_chart 
  y_axis_options={
    title={{my_title}}
    labels={{show_labels}}
    min=0
  }
/%}`;
			const expected = `{% combo_chart 
  y_axis_options={
    title="{{my_title}}"
    labels="{{show_labels}}"
    min=0
  }
/%}`;
			expect(preprocessVariables(input)).toBe(expected);
		});

		it('should handle escaped quotes', () => {
			const input = '{% component title="Quote: \\"{{var}}\\"" hide={{var2}} /%}';
			const expected = '{% component title="Quote: \\"{{var}}\\"" hide="{{var2}}" /%}';
			expect(preprocessVariables(input)).toBe(expected);
		});

		it('should handle escaped backslashes followed by quotes', () => {
			const input = '{% component title="ends with \\\\" hide={{var}} /%}';
			const expected = '{% component title="ends with \\\\" hide="{{var}}" /%}';
			expect(preprocessVariables(input)).toBe(expected);
		});
	});
});
