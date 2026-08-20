// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount, type ComponentProps } from 'svelte';
import IFrame from './IFrame.svelte';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
});

function renderIFrame(props: ComponentProps<typeof IFrame>): HTMLIFrameElement {
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(IFrame, { target, props });
	flushSync();
	const frame = target.querySelector('iframe');
	if (!frame) throw new Error('IFrame did not render');
	return frame;
}

describe('iframe URL safety', () => {
	it('keeps a safe src', () => {
		expect(renderIFrame({ src: 'https://example.com' }).getAttribute('src')).toBe(
			'https://example.com'
		);
	});

	it.each(['javascript:alert(1)', 'data:text/html,<h1>x</h1>', 'vbscript:msgbox(1)'])(
		'rewrites the unsafe src %s',
		(src) => {
			expect(renderIFrame({ src }).getAttribute('src')).toBe('about:blank');
		}
	);

	// Both reach the page through `{% iframe src="https://ok" attrs={<key>="<payload>"} /%}`,
	// which Markdoc parses and validates without complaint.
	it('attrs cannot put back the src the sanitizer removed', () => {
		const frame = renderIFrame({
			src: 'https://example.com',
			attrs: { src: 'javascript:alert(1)' }
		});
		expect(frame.getAttribute('src')).toBe('https://example.com');
	});

	it('attrs cannot smuggle in srcdoc, which runs in our own origin', () => {
		const frame = renderIFrame({
			src: 'https://example.com',
			attrs: { srcdoc: '<script>alert(1)</script>' }
		});
		expect(frame.getAttribute('srcdoc')).toBeNull();
	});

	// The only keys real pages pass today. Filtering must not touch them.
	it('leaves ordinary presentational attrs alone', () => {
		const frame = renderIFrame({
			src: 'https://example.com',
			height: 400,
			attrs: { style: 'border: 0', title: 'Embedded report', allowfullscreen: 'true' }
		});
		expect(frame.getAttribute('title')).toBe('Embedded report');
		expect(frame.getAttribute('allowfullscreen')).toBe('true');
		expect(frame.getAttribute('style')).toContain('border: 0');
		expect(frame.getAttribute('style')).toContain('400px');
	});
});
