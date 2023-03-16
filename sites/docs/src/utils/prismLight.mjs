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
    {    types: ['atrule', 'boolean', 'constant', 'id', 'important', 'symbol'],
    style: {
      color: '#7c4dff'
    }
  },
  {
    types: ['attr-name', 'attribute', 'builtin', 'cdata', 'char', 'class', 'operator', 'property', 'punctuation'],
    style: {
      color: '#39adb5'
    }
  },
  {
    types: ['attr-value', 'pseudo-class', 'pseudo-element', 'string', 'variable'],
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
    types: ['deleted', 'entity', 'selector', 'tag', 'url', 'variable'],
    style: {
      color: '#e53935'
    }
  },
  {
    types: ['function', 'number'],
    style: {
      color: '#046ade'
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
    types: ['doctype', 'prolog', 'comment'],
    style: {
      color: '#9AA5B1'
    }
  }
  ],
};