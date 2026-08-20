import type { RenderableTreeNode, Scalar, Tag } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';

type SerializedTag = {
	$$mdtype: Tag['$$mdtype'];
	name: Tag['name'];
	attributes: Tag['attributes'];
	children: Tag['children'];
	location: Tag['location'];
	lines: Tag['lines'];
	id: Tag['id'];
};

const isSerializedTag = (json: SerializedTree): json is SerializedTag =>
	typeof json === 'object' && json !== null && '$$mdtype' in json;

export type SerializedTree = SerializedTag | Scalar;

export const serializeTree = (tree: RenderableTreeNode): SerializedTree => {
	if (Markdoc.Tag.isTag(tree)) {
		return {
			$$mdtype: tree.$$mdtype,
			name: tree.name,
			attributes: tree.attributes,
			children: tree.children.map((child) => serializeTree(child)),
			location: tree.location,
			lines: tree.lines,
			id: tree.id
		};
	}
	return tree;
};

export const deserializeTree = (json: SerializedTree): RenderableTreeNode => {
	if (isSerializedTag(json)) {
		return new Markdoc.Tag(
			json.name,
			json.attributes,
			json.children.map((child) => deserializeTree(child)),
			json.location,
			json.lines,
			json.id
		);
	}
	return json;
};
