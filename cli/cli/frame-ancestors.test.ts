import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { framingHeaders, resetFramingWarningForTest } from './frame-ancestors.ts';

const HTML = 'text/html; charset=utf-8';

beforeEach(() => {
	resetFramingWarningForTest();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('framingHeaders: the default is DENY', () => {
	it.each([undefined, null, '', '   '])('refuses framing when the value is %o', (value) => {
		expect(framingHeaders(value, HTML)).toEqual({ 'X-Frame-Options': 'DENY' });
	});

	it('treats `none` as the explicit spelling of the default', () => {
		expect(framingHeaders('none', HTML)).toEqual({ 'X-Frame-Options': 'DENY' });
		expect(framingHeaders("'none'", HTML)).toEqual({ 'X-Frame-Options': 'DENY' });
	});
});

describe('framingHeaders: allowing framing', () => {
	it('pairs `self` with SAMEORIGIN, which cannot contradict it', () => {
		expect(framingHeaders('self', HTML)).toEqual({
			'Content-Security-Policy': "frame-ancestors 'self'",
			'X-Frame-Options': 'SAMEORIGIN'
		});
	});

	it('accepts an origin, and drops X-Frame-Options because it has no such form', () => {
		// A SAMEORIGIN next to a cross-origin CSP would be a contradiction that
		// only pre-CSP2 browsers act on — and they would act on the wrong half.
		expect(framingHeaders('https://intranet.example.com', HTML)).toEqual({
			'Content-Security-Policy': 'frame-ancestors https://intranet.example.com'
		});
	});

	it.each([
		'https://a.example https://b.example',
		'https://a.example,https://b.example',
		'  https://a.example ,  https://b.example  '
	])('accepts several origins written as %o', (value) => {
		expect(framingHeaders(value, HTML)).toEqual({
			'Content-Security-Policy': 'frame-ancestors https://a.example https://b.example'
		});
	});

	it('keeps `self` alongside an origin', () => {
		expect(framingHeaders('self https://a.example', HTML)).toEqual({
			'Content-Security-Policy': "frame-ancestors 'self' https://a.example"
		});
	});

	it('accepts a port, and a trailing slash on an origin', () => {
		expect(framingHeaders('http://localhost:8080/', HTML)).toEqual({
			'Content-Security-Policy': 'frame-ancestors http://localhost:8080'
		});
	});

	it("accepts CSP's subdomain wildcard", () => {
		// A deployment framed by many hosts of one domain is a real case.
		expect(framingHeaders('https://*.example.com', HTML)).toEqual({
			'Content-Security-Policy': 'frame-ancestors https://*.example.com'
		});
	});
});

describe('framingHeaders: a bad value fails closed', () => {
	it.each([
		'https://a.example/reports',
		'https://a.example?x=1',
		'*',
		'https://*',
		'https://ex*ample.com',
		'ftp://a.example',
		'a.example',
		'javascript:alert(1)',
		'https://user:pw@a.example',
		'none https://a.example'
	])('refuses framing for %o and says so once', (value) => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		expect(framingHeaders(value, HTML)).toEqual({ 'X-Frame-Options': 'DENY' });
		expect(warn).toHaveBeenCalledOnce();
		expect(warn.mock.calls[0][0]).toContain('EVIDENCE_FRAME_ANCESTORS');
	});

	it('warns once per process, not once per response', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		framingHeaders('*', HTML);
		framingHeaders('*', HTML);

		expect(warn).toHaveBeenCalledOnce();
	});
});

describe('framingHeaders: only documents carry the policy', () => {
	it.each([
		'application/json',
		'text/css',
		'application/javascript',
		'image/png',
		undefined,
		null,
		''
	])('leaves %o exactly as it was before the setting existed', (contentType) => {
		// The query relay's JSON and every static asset keep the plain default, so
		// enabling framing does not show up in a header scan of the whole site.
		expect(framingHeaders('self', contentType)).toEqual({ 'X-Frame-Options': 'DENY' });
	});

	it('recognises a document by its media type, parameters included', () => {
		expect(framingHeaders('self', 'text/html')).toHaveProperty('Content-Security-Policy');
		expect(framingHeaders('self', 'TEXT/HTML; charset=utf-8')).toHaveProperty(
			'Content-Security-Policy'
		);
	});
});
