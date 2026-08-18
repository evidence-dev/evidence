import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { loadTranslations, getTranslationLanguages } from './translations.server';

let projectRoot: string;

beforeEach(async () => {
	projectRoot = await mkdtemp(path.join(tmpdir(), 'evidence-translations-test-'));
});

afterEach(async () => {
	await rm(projectRoot, { recursive: true, force: true });
});

async function writeTranslations(content: string) {
	await writeFile(path.join(projectRoot, 'translations.yaml'), content, 'utf-8');
}

describe('loadTranslations', () => {
	it('returns undefined when translations.yaml is absent', async () => {
		expect(await loadTranslations(projectRoot, null)).toBeUndefined();
	});

	it('resolves the requested language when it is declared', async () => {
		await writeTranslations(`en:\n  greeting: "Hello"\nfr:\n  greeting: "Bonjour"\n`);
		const result = await loadTranslations(projectRoot, 'fr');
		expect(result?.greeting).toBe('Bonjour');
	});

	it('falls back to English for keys missing in the requested language', async () => {
		await writeTranslations(
			`en:\n  greeting: "Hello"\n  farewell: "Goodbye"\nfr:\n  greeting: "Bonjour"\n`
		);
		const result = await loadTranslations(projectRoot, 'fr');
		expect(result?.greeting).toBe('Bonjour');
		expect(result?.farewell).toBe('Goodbye');
	});

	it('uses the first declared language when no lang is requested', async () => {
		await writeTranslations(`es:\n  greeting: "Hola"\nfr:\n  greeting: "Bonjour"\n`);
		const result = await loadTranslations(projectRoot, null);
		expect(result?.greeting).toBe('Hola');
	});

	it('ignores an unknown requested language and uses the first declared one', async () => {
		await writeTranslations(`en:\n  greeting: "Hello"\n`);
		const result = await loadTranslations(projectRoot, 'zz');
		expect(result?.greeting).toBe('Hello');
	});

	it('resolves $t() references after the fallback merge', async () => {
		await writeTranslations(
			`en:\n  name: "World"\n  greeting: "Hello, $t(name)!"\nfr:\n  greeting: "Bonjour, $t(name)!"\n`
		);
		const result = await loadTranslations(projectRoot, 'fr');
		expect(result?.greeting).toBe('Bonjour, World!');
	});

	it('still resolves translations when evidence.config.yaml is malformed', async () => {
		await writeFile(
			path.join(projectRoot, 'evidence.config.yaml'),
			`project:\n  name: "unterminated\n`,
			'utf-8'
		);
		await writeTranslations(`en:\n  greeting: "Hello"\n`);
		const result = await loadTranslations(projectRoot, null);
		expect(result?.greeting).toBe('Hello');
	});
});

describe('getTranslationLanguages', () => {
	it('returns the declared language codes in order', async () => {
		await writeTranslations(`en:\n  greeting: "Hello"\nfr:\n  greeting: "Bonjour"\n`);
		expect(await getTranslationLanguages(projectRoot)).toEqual(['en', 'fr']);
	});

	it('returns an empty array when translations.yaml is absent', async () => {
		expect(await getTranslationLanguages(projectRoot)).toEqual([]);
	});
});
