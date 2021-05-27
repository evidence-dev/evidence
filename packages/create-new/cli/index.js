//eslint-disable-next-line import/no-unresolved
import fsExtra from 'fs-extra'
const { copySync,readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } = fsExtra
import path from 'path';
import { bold, cyan, green, red } from 'kleur/colors';
import prompts from 'prompts/lib/index';
import { fileURLToPath } from 'url';

const welcome = `Welcome to evidence!`
const disclaimer = `
Evidence is in public alpha. 
There will be bugs. Things will change before the stable release.
`;

async function main() {
	console.log(bold(green(welcome)));
	console.log(bold(red(disclaimer)));

	const cwd = process.argv[2] || '.';

	const template = fileURLToPath(new URL(`./dist/template`, import.meta.url).href);

	if (existsSync(cwd)) {
		if (readdirSync(cwd).length > 0) {
			const response = await prompts({
				type: 'confirm',
				name: 'value',
				message: 'Directory not empty. Continue?',
				initial: false
			});

			if (!response.value) {
				process.exit(1);
			}
		}
	} else {
		mkdirp(cwd);
	}

	copySync(template, cwd)

	console.log(bold(green('✔ Copied project files')));

	console.log('\nNext steps:');
	let i = 1;

	const relative = path.relative(process.cwd(), cwd);
	if (relative !== '') {
		console.log(`  ${i++}: ${bold(cyan(`cd ${relative}`))}`);
	}

	console.log(`  ${i++}: ${bold(cyan('npm install'))}`);
	console.log(`  ${i++}: ${bold(cyan('npm run dev -- --open'))}`);

	console.log(`\nTo close the dev server, hit ${bold(cyan('Ctrl-C'))}`);
	console.log('\nStuck? Visit us at https://docs.evidence.dev');
}

/**
 * @param {string} id
 * @param {string} name
 * @param {string} cwd
 */
function write_template_files(id, name, cwd) {
	const template = fileURLToPath(new URL(`./dist/templates/${id}.json`, import.meta.url).href);
	const { files } = /** @type {import('./types').Template} */ (JSON.parse(
		readFileSync(template, 'utf-8')
	));

	files.forEach((file) => {
		const dest = path.join(cwd, file.name);
		mkdirp(path.dirname(dest));

		writeFileSync(
			dest,
			file.encoding === 'base64'
				? Buffer.from(file.contents, 'base64')
				: file.contents.replace(/~TODO~/g, name)
		);
	});
}

/** @param {string} dir */
function mkdirp(dir) {
	try {
		mkdirSync(dir, { recursive: true });
	} catch (e) {
		if (e.code === 'EEXIST') return;
		throw e;
	}
}

main();
