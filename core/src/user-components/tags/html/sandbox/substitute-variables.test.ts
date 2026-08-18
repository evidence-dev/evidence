// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { createVariableSubstitution } from './substitute-variables';

const mount = (html: string): HTMLElement => {
	document.body.innerHTML = `<div id="root">${html}</div>`;
	return document.getElementById('root')!;
};

describe('createVariableSubstitution', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	it('substitutes {{ $name }} tokens in text nodes', () => {
		const root = mount('<h1>{{ $title }}</h1><p>Hi {{$name}}, {{ $title }} again</p>');
		createVariableSubstitution(root, { title: 'Revenue', name: 'Ada' });
		expect(root.querySelector('h1')!.textContent).toBe('Revenue');
		expect(root.querySelector('p')!.textContent).toBe('Hi Ada, Revenue again');
	});

	it('is injection-safe by construction: markup in values renders as text', () => {
		const root = mount('<h1>{{ $title }}</h1>');
		createVariableSubstitution(root, { title: '<script>alert(1)</script><b>x</b>' });
		expect(root.querySelectorAll('script, b')).toHaveLength(0);
		expect(root.querySelector('h1')!.textContent).toBe('<script>alert(1)</script><b>x</b>');
	});

	it('never touches script/style/template contents', () => {
		const root = mount(
			'<script>const t = "{{ $title }}";</script><style>/* {{ $title }} */</style><template><i>{{ $title }}</i></template><span>{{ $title }}</span>'
		);
		createVariableSubstitution(root, { title: 'X' });
		expect(root.querySelector('script')!.textContent).toContain('{{ $title }}');
		expect(root.querySelector('style')!.textContent).toContain('{{ $title }}');
		expect(root.querySelector('template')!.innerHTML).toContain('{{ $title }}');
		expect(root.querySelector('span')!.textContent).toBe('X');
	});

	it('leaves unknown names literal and renders null/undefined as empty', () => {
		const root = mount('<p>{{ $known }} / {{ $unknown }} / {{ $empty }}</p>');
		createVariableSubstitution(root, { known: 'v', empty: null });
		expect(root.querySelector('p')!.textContent).toBe('v / {{ $unknown }} / ');
	});

	it('re-applies reactively from the remembered template', () => {
		const root = mount('<h1>{{ $title }}!</h1>');
		const sub = createVariableSubstitution(root, { title: 'A' });
		expect(root.querySelector('h1')!.textContent).toBe('A!');
		sub.apply({ title: 'B' });
		expect(root.querySelector('h1')!.textContent).toBe('B!');
	});

	it('reports trackedCount and prunes removed nodes on apply', () => {
		const root = mount('<h1>{{ $a }}</h1><p>{{ $a }}</p><span>static</span>');
		const sub = createVariableSubstitution(root, { a: '1' });
		expect(sub.trackedCount).toBe(2);
		root.querySelector('p')!.remove();
		sub.apply({ a: '2' });
		expect(sub.trackedCount).toBe(1);
		expect(root.querySelector('h1')!.textContent).toBe('2');
	});
});
