import Markdoc, { type Node, type Config } from '@markdoc/markdoc';

// Schema for native HTML table elements from markdown
// This prevents collision with the Evidence {% table %} tag
// We use a different render name (html_table) to distinguish from the Evidence table component
export const tableSchema = {
	render: 'html_table',
	category: 'ui',
	attributes: {},
	transform(node: Node, config: Config) {
		return new Markdoc.Tag(
			'html_table',
			node.transformAttributes(config),
			node.transformChildren(config)
		);
	}
};
