# Date Range DAG Test

## Basic Usage
<Checkbox name="myCheckbox" title="My Checkbox"/>

<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>
</tr>
<tr>
<td class="px-2">{inputs.myCheckbox}</td>
<td class="px-2">{inputs.myCheckbox.value}</td>
<td class="px-2">{inputs.myCheckbox.label}</td>
</tr>
</table>


## Remount Behvaior
<Checkbox name="toggleRange" title="Toggle Date Range" />

{#if inputs.toggleRange}
    <Checkbox name="myCheckbox2" title="My Checkbox 2"/>

{/if}
<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>
</tr>
<tr>
<td class="px-2">{inputs.myCheckbox2}</td>
<td class="px-2">{inputs.myCheckbox2.value}</td>
<td class="px-2">{inputs.myCheckbox2.label}</td>
</tr>
</table>