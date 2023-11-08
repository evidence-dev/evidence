<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { version } from '$app/environment';
	const timestamp = Number(version);

	export let prefix = 'Last refreshed';

	function timeAgo(startTimestamp, endTimestamp) {
		const secondsAgo = Math.floor((endTimestamp - startTimestamp) / 1000);

		if (secondsAgo < 60) {
			return secondsAgo === 1 ? '1 second ago' : `${secondsAgo} seconds ago`;
		} else if (secondsAgo < 3600) {
			const minutesAgo = Math.round(secondsAgo / 60);
			return minutesAgo === 1 ? '1 min ago' : `${minutesAgo} mins ago`;
		} else if (secondsAgo < 86400) {
			const hoursAgo = (secondsAgo / 3600).toFixed(1);
			return hoursAgo === '1' ? '1 hour ago' : `${hoursAgo} hours ago`;
		} else if (secondsAgo < 604800) {
			const daysAgo = Math.round(secondsAgo / 86400);
			return daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
		} else if (secondsAgo < 2592000) {
			const weeksAgo = Math.round(secondsAgo / 604800);
			return weeksAgo === 1 ? '1 week ago' : `${weeksAgo} weeks ago`;
		} else if (secondsAgo < 31536000) {
			const monthsAgo = Math.round(secondsAgo / 2592000);
			return monthsAgo === 1 ? '1 month ago' : `${monthsAgo} months ago`;
		} else {
			const yearsAgo = Math.round(secondsAgo / 31536000);
			return yearsAgo === 1 ? '1 year ago' : `${yearsAgo} years ago`;
		}
	}

	const varTimeAgo = timeAgo(timestamp, Date.now());
</script>

<p class="text-sm py-1 cursor-text" title={new Date(timestamp).toLocaleString()}>
	{prefix}
	{varTimeAgo}
</p>
