import isEqual from 'lodash/isEqual';

export const useStable = <T>(getter: () => T): (() => T) => {
	let current = $state(getter());
	$effect(() => {
		const newValue = getter();
		if (isEqual(newValue, current)) return;
		current = newValue;
	});

	return () => current;
};
