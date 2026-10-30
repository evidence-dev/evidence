import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
	replaceHtmlLangPlaceholder,
	resetHtmlLangCacheForTest,
	resolveHtmlLang
} from './html-lang.server';

let projectRoot: string;

beforeEach(async () => {
	projectRoot = await mkdtemp(path.join(tmpdir(), 'evidence-html-lang-test-'));
	resetHtmlLangCacheForTest();
});

afterEach(async () => {
	await rm(projectRoot, { recursive: true, force: true });
});

const writeTranslations = (content: string) =>
	writeFile(path.join(projectRoot, 'translations.yaml'), content, 'utf-8');

describe('resolveHtmlLang', () => {
	it('is English for a project with no translations', async () => {
		expect(await resolveHtmlLang(projectRoot, null)).toBe('en');
	});

	it('is the requested language when the project declares it', async () => {
		await writeTranslations(`en:\n  greeting: "Hello"\nit:\n  greeting: "Ciao"\n`);

		expect(await resolveHtmlLang(projectRoot, 'it')).toBe('it');
	});

	it("falls back to the project's first language when the request names another", async () => {
		await writeTranslations(`it:\n  greeting: "Ciao"\nfr:\n  greeting: "Bonjour"\n`);

		expect(await resolveHtmlLang(projectRoot, 'de')).toBe('it');
		expect(await resolveHtmlLang(projectRoot, null)).toBe('it');
	});

	it('never lets an unusable language key reach the attribute', async () => {
		// Translation keys are unvalidated, so `lang` gets a plausible tag or 'en'.
		await writeTranslations(`italiano:\n  greeting: "Ciao"\n`);

		expect(await resolveHtmlLang(projectRoot, 'italiano')).toBe('en');
	});

	it('reads translations.yaml once per project', async () => {
		await writeTranslations(`it:\n  greeting: "Ciao"\n`);
		expect(await resolveHtmlLang(projectRoot, null)).toBe('it');

		// The file is immutable in serve mode, so the cached list is the point: a
		// later edit is picked up by the restart a new translation needs anyway.
		await writeTranslations(`fr:\n  greeting: "Bonjour"\n`);
		expect(await resolveHtmlLang(projectRoot, null)).toBe('it');

		resetHtmlLangCacheForTest();
		expect(await resolveHtmlLang(projectRoot, null)).toBe('fr');
	});
});

describe('replaceHtmlLangPlaceholder', () => {
	it('fills the placeholder in the shell', () => {
		expect(replaceHtmlLangPlaceholder('<html lang="%evidence.lang%">', 'it')).toBe(
			'<html lang="it">'
		);
	});

	it('leaves a chunk without the placeholder alone', () => {
		expect(replaceHtmlLangPlaceholder('<div>%evidence.other%</div>', 'it')).toBe(
			'<div>%evidence.other%</div>'
		);
	});
});
