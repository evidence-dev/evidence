# Date Range DAG Test

## Basic Usage
<Dropdown name="myDropdown">
    <DropdownOption value={1} valueLabel="One"/>
    <DropdownOption value={2} valueLabel="Two"/>
    <DropdownOption value={3} valueLabel="Three"/>
    
</Dropdown>

<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>
</tr>
<tr>
<td class="px-2">{inputs.myDropdown}</td>
<td class="px-2">{inputs.myDropdown.value}</td>
<td class="px-2">{inputs.myDropdown.label}</td>
</tr>
</table>

### Multiselect
<Dropdown name="myDropdownMulti" multiple>
    <DropdownOption value={1} valueLabel="One"/>
    <DropdownOption value={2} valueLabel="Two"/>
    <DropdownOption value={3} valueLabel="Three"/>
    <DropdownOption value="String" valueLabel="String Value"/>
</Dropdown>

<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>
</tr>
<tr>
<td class="px-2">{inputs.myDropdownMulti}</td>
<td class="px-2">{inputs.myDropdownMulti.value}</td>
<td class="px-2">{inputs.myDropdownMulti.label}</td>
</tr>
</table>


## Remount Behvaior
<Checkbox name="toggleRange" title="Toggle Date Range" />

{#if inputs.toggleRange}
    <Dropdown name="myDropdown2">
    <DropdownOption value={1} valueLabel="One"/>
    <DropdownOption value={2} valueLabel="Two"/>
    <DropdownOption value={3} valueLabel="Three"/>
    </Dropdown>

{/if}
<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>
</tr>
<tr>
<td class="px-2">{inputs.myDropdown2}</td>
<td class="px-2">{inputs.myDropdown2.value}</td>
<td class="px-2">{inputs.myDropdown2.label}</td>
</tr>
</table>

## Query-Driven Behavior

🚩 Implement this

## Behavior with defaults

🚩 Implement this