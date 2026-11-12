import { describe, expect, it } from 'vitest';
import { fr } from 'date-fns/locale';
import { formatTimeAgo } from './time';

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600_000);

describe('formatTimeAgo', () => {
	it('keeps the English wording when no locale is given', () => {
		expect(formatTimeAgo(new Date())).toBe('just now');
		expect(formatTimeAgo(hoursAgo(2))).toBe('about 2 hours ago');
	});

	it('renders in the given locale, including the just-now label', () => {
		const localized = { locale: fr, justNow: "à l'instant" };
		expect(formatTimeAgo(new Date(), localized)).toBe("à l'instant");
		expect(formatTimeAgo(hoursAgo(2), localized)).toBe('il y a environ 2 heures');
	});
});
