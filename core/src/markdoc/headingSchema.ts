import Markdoc, { type Schema } from '@markdoc/markdoc';

export const headingSchema: Schema = {
	...Markdoc.nodes.heading,
	transform(node, config) {
		const baseTransform = Markdoc.nodes.heading.transform;
		if (!baseTransform) return null;
		const tag = baseTransform(node, config);
		const loc = node.location;
		if (Markdoc.Tag.isTag(tag) && loc?.start) {
			const { line, character = 0 } = loc.start;
			tag.attributes['data-heading-id'] = loc.file
				? `${loc.file}::${line}-${character}`
				: `${line}-${character}`;
		}
		return tag;
	}
};
