<script lang="ts">
	import { useId } from 'bits-ui';
	import { getDropdownContext } from '../dropdown/dropdown-context';
	import { getButtonGroupContext } from '../button_group/button-group-context';
	import { getInputTabsContext } from '../input_tabs/input-tabs-context';
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import type { Option } from './types';

	const props: UserComponentProps<typeof schema> = $props();

	const value = $derived(props.value);
	const label = $derived(props.label);
	const fmt = $derived(props.fmt);

	// Try to get context from any parent type
	const dropdownContext = getDropdownContext();
	const buttonGroupContext = getButtonGroupContext();
	const inputTabsContext = getInputTabsContext();
	const context = dropdownContext || buttonGroupContext || inputTabsContext;

	if (!context) {
		throw new Error('Option component must be used inside a dropdown, button_group, or input_tabs');
	}

	const { addOption, removeOption } = context;

	const id = useId('option-from-children');
	const option: Option = $derived({
		id,
		value: String(value),
		label,
		fmt
	});

	$effect(() => {
		addOption(option);
		return () => {
			removeOption(option);
		};
	});
</script>
