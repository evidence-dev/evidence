/**
 * Time utilities for @evidence/core
 */
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';

export function formatTimeAgo(date: Date): string {
	const secondsAgo = differenceInSeconds(new Date(), date);
	if (secondsAgo < 60) {
		return 'just now';
	}
	return formatDistanceToNow(date) + ' ago';
}
