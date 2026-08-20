import { describe, expect, it } from 'vitest';
import Markdoc from '@markdoc/markdoc';

import { schema as dropdownSchema } from './schema';
import { schema as optionSchema } from '../option/schema';

describe('dropdown initial_value with child options', () => {
	it('keeps string initial_value when matching option appears later in children', () => {
		const markdown =
			'{% dropdown id="efwfw" initial_value="three" %}\n{% option value=1 /%}\n{% option value=2 /%}\n{% option value="three" /%}\n{% /dropdown %}'; // pragma: allowlist secret

		const tokenizer = new Markdoc.Tokenizer({ allowComments: true, allowIndentation: true });
		const ast = Markdoc.parse(tokenizer.tokenize(markdown));
		const transformed = Markdoc.transform(ast, {
			tags: {
				dropdown: dropdownSchema,
				option: optionSchema
			}
		} as Parameters<typeof Markdoc.transform>[1]);

		const dropdown = (transformed as { children: Array<{ attributes: Record<string, unknown> }> })
			.children[0];

		expect(dropdown.attributes.initial_value).toBe('three');
	});
});
