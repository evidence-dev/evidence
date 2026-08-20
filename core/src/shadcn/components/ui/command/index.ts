import { Command as CommandPrimitive } from 'bits-ui';

import Root from './command.svelte';
import Dialog from './command-dialog.svelte';
import Empty from './command-empty.svelte';
import Group from './command-group.svelte';
import Item from './command-item.svelte';
import Input from './command-input.svelte';
import List from './command-list.svelte';
import Separator from './command-separator.svelte';
import Shortcut from './command-shortcut.svelte';
import LinkItem from './command-link-item.svelte';

const Loading = CommandPrimitive.Loading;

export {
	Root,
	Dialog,
	Empty,
	Group,
	Item,
	LinkItem,
	Input,
	List,
	Separator,
	Shortcut,
	Loading,
	//
	Root as Command,
	Dialog as CommandDialog,
	Empty as CommandEmpty,
	Group as CommandGroup,
	Item as CommandItem,
	LinkItem as CommandLinkItem,
	Input as CommandInput,
	List as CommandList,
	Separator as CommandSeparator,
	Shortcut as CommandShortcut,
	Loading as CommandLoading,
	// Re-export the raw bits-ui Command namespace from THIS module so
	// downstream packages can grab unwrapped primitives (e.g. `.Input`)
	// without pulling in a second copy of `bits-ui`. Without this,
	// importing `Command` from `bits-ui` directly in a different package
	// can resolve to a separate module instance, breaking Svelte context
	// (`Context "Command.Root" not found` at runtime in production builds).
	CommandPrimitive
};
