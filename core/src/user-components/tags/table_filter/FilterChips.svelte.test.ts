// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import FilterChipsTestHarness from './FilterChipsTestHarness.svelte';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
});

function renderBooleanChip(language: string | null) {
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(FilterChipsTestHarness, {
		target,
		props: {
			language,
			filters: [
				{ columnId: 'is_active', conditions: [{ type: 'boolean', operator: 'is', value: true }] }
			]
		}
	});
	flushSync();
	const chip = Array.from(target.querySelectorAll('button')).find((button) =>
		['Yes', 'No', 'Oui', 'Non'].includes(button.textContent?.trim() ?? '')
	);
	if (!chip) throw new Error(`no boolean chip in: ${target.textContent}`);
	return chip;
}

describe('FilterChips boolean chip', () => {
	it.each([
		['fr', 'Oui', 'Non'],
		['fr-CA', 'Oui', 'Non'],
		['en', 'Yes', 'No'],
		[null, 'Yes', 'No']
	])('shows the value in the page language (%s) and toggles it', (language, yes, no) => {
		const chip = renderBooleanChip(language);
		expect(chip.textContent?.trim()).toBe(yes);

		chip.click();
		flushSync();
		expect(chip.textContent?.trim()).toBe(no);
	});
});
