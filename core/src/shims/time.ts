/**
 * Time utilities for @evidence/core
 */
import { formatDistanceToNow, differenceInSeconds, type Locale } from 'date-fns';

/** Without `locale`, English (`about 2 hours ago`); with one, that language (`il y a environ 2 heures`). */
export function formatTimeAgo(date: Date, localized?: { locale: Locale; justNow: string }): string {
	const secondsAgo = differenceInSeconds(new Date(), date);
	if (secondsAgo < 60) {
		return localized?.justNow ?? 'just now';
	}
	if (localized) return formatDistanceToNow(date, { addSuffix: true, locale: localized.locale });
	return formatDistanceToNow(date) + ' ago';
}
