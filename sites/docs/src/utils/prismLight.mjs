/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import lightTheme from 'prism-react-renderer/themes/github/index.cjs.js';

export default {
	...lightTheme,
	styles: [
		// ...lightTheme.styles,
		{
			types: ['atrule', 'boolean', 'constant', 'id', 'symbol'],
			style: {
				color: '#7c4dff'
			}
		},
		{
			types: [
				'attr-name',
				'attribute',
				'builtin',
				'cdata',
				'char',
				'class',
				'operator',
				'property'
			],
			style: {
				color: '#39adb5'
			}
		},
		{
			types: ['punctuation'],
			style: {
				color: '#7A8694'
			}
		},
		{
			types: ['attr-value', 'pseudo-class', 'pseudo-element', 'string', 'variable', 'url'],
			style: {
				color: '#f6a434'
			}
		},
		{
			types: ['class-name', 'regex'],
			style: {
				color: '#6182b8'
			}
		},
		{
			types: ['deleted', 'entity', 'selector'],
			style: {
				color: '#e53935'
			}
		},
		{
			types: ['function', 'number'],
			style: {
				color: '#046ade',
				fontWeight: 'bold'
			}
		},
		{
			types: ['keyword'],
			style: {
				color: '#08a86d'
			}
		},
		{
			types: ['hexcode', 'unit'],
			style: {
				color: '#f76d47'
			}
		},
		{
			types: ['bold'],
			style: {
				fontWeight: 'bold'
			}
		},
		{
			types: ['italic'],
			style: {
				fontStyle: 'italic'
			}
		},
		{
			types: ['title'],
			style: {
				fontWeight: 'bold',
				color: '#236aa4'
			}
		},
		{
			types: ['tag'],
			style: {
				color: '#236aa4'
			}
		},
		{
			types: ['doctype', 'prolog', 'comment'],
			style: {
				color: '#9AA5B1'
			}
		}
	]
};
