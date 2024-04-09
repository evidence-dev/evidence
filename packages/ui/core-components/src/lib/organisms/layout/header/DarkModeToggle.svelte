<script >
import { Icon } from '@steeze-ui/svelte-icon';
import {Sun , Moon} from "@steeze-ui/radix-icons";


import { resetMode, setMode } from "mode-watcher";
import { Button } from "$lib/atoms/shadcn/button/index.js";
import * as DropdownMenu from "$lib/atoms/shadcn/dropdown-menu/index.js";
import { ModeWatcher } from "mode-watcher";

</script>

<ModeWatcher />


<DropdownMenu.Root>
<DropdownMenu.Trigger asChild let:builder>
<Button builders={[builder]} variant="ghost" size="icon">
<Icon src={Sun} class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
<Icon src={Moon} class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 "/>
<span class="sr-only">Toggle theme</span>
</Button>
</DropdownMenu.Trigger>
<DropdownMenu.Content align="end">
<DropdownMenu.Item on:click={() => setMode("light")}
>Light</DropdownMenu.Item
>
<DropdownMenu.Item on:click={() => setMode("dark")}>Dark</DropdownMenu.Item>
<DropdownMenu.Item on:click={() => resetMode()}>System</DropdownMenu.Item>
</DropdownMenu.Content>
</DropdownMenu.Root>