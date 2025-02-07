export let displayedStoryURL = window.location.href; // The string that updates

const updateURL = () => {
	const newURL = window.location.href;
	if (newURL !== displayedStoryURL) {
		displayedStoryURL = newURL; // Update the variable

		// Try forcing Storybook to recognize the change
		const iframe = document.querySelector('iframe');
		if (iframe) {
			iframe.src = iframe.src; // Force reload
		}
	}
};

export const initStorybookURLWatcher = () => {
	const pushState = history.pushState;
	const replaceState = history.replaceState;

	history.pushState = function () {
		pushState.apply(history, arguments);
		updateURL();
	};

	history.replaceState = function () {
		replaceState.apply(history, arguments);
		updateURL();
	};

	window.addEventListener('popstate', updateURL);
};
