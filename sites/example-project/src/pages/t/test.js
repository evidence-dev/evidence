import preprocess from '@evidence-dev/preprocess';
import * as svelte from 'svelte/compiler';
import fs from 'fs';
import path from 'path';

const dir = path.dirname(import.meta.url.substring('file://'.length));

const page = fs.readFileSync(path.join(dir, '+page.md'), 'utf-8');

svelte.preprocess(page, preprocess(), { filename: path.join(dir, '+page.md') }).then((output) => {
	fs.writeFileSync(path.join(dir, 'page.svelte'), output.code);

	// Checks the validity of the file
	svelte.parse(output.code, { filename: path.join(dir, 'page.svelte') });
});
