import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isCI, isTelemetryDisabled } from './telemetry.ts';

const CI_VARS = [
	'CI',
	'GITHUB_ACTIONS',
	'GITLAB_CI',
	'CIRCLECI',
	'BUILDKITE',
	'TF_BUILD',
	'JENKINS_URL'
];

describe('isCI', () => {
	let saved: Record<string, string | undefined>;

	beforeEach(() => {
		saved = {};
		for (const k of CI_VARS) {
			saved[k] = process.env[k];
			delete process.env[k];
		}
	});

	afterEach(() => {
		for (const k of CI_VARS) {
			if (saved[k] === undefined) delete process.env[k];
			else process.env[k] = saved[k];
		}
	});

	it('is false with no CI vars set', () => {
		expect(isCI()).toBe(false);
	});

	it('treats CI=true / CI=1 as CI', () => {
		process.env.CI = 'true';
		expect(isCI()).toBe(true);
		process.env.CI = '1';
		expect(isCI()).toBe(true);
	});

	it('does not treat CI=false or CI=0 as CI', () => {
		process.env.CI = 'false';
		expect(isCI()).toBe(false);
		process.env.CI = '0';
		expect(isCI()).toBe(false);
	});

	it('detects provider-specific vars even when CI is unset', () => {
		process.env.GITHUB_ACTIONS = 'true';
		expect(isCI()).toBe(true);
		delete process.env.GITHUB_ACTIONS;

		process.env.JENKINS_URL = 'http://jenkins.local';
		expect(isCI()).toBe(true);
	});
});

describe('isTelemetryDisabled', () => {
	const OPT_OUT_VARS = ['EVIDENCE_TELEMETRY_DISABLED', 'DO_NOT_TRACK'];
	let saved: Record<string, string | undefined>;

	beforeEach(() => {
		saved = {};
		for (const k of OPT_OUT_VARS) {
			saved[k] = process.env[k];
			delete process.env[k];
		}
	});

	afterEach(() => {
		for (const k of OPT_OUT_VARS) {
			if (saved[k] === undefined) delete process.env[k];
			else process.env[k] = saved[k];
		}
	});

	it('is false with neither var set', () => {
		expect(isTelemetryDisabled()).toBe(false);
	});

	it('opts out on EVIDENCE_TELEMETRY_DISABLED or DO_NOT_TRACK', () => {
		for (const k of OPT_OUT_VARS) {
			process.env[k] = '1';
			expect(isTelemetryDisabled()).toBe(true);
			delete process.env[k];
		}
	});

	it('ignores falsy values so an unset-looking var does not opt out', () => {
		for (const value of ['', '0', 'false']) {
			process.env.DO_NOT_TRACK = value;
			expect(isTelemetryDisabled()).toBe(false);
		}
	});
});
