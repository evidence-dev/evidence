# Date Range DAG Test

## Basic Usage
<DateRange name="myRange"/>

<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>

<th class="px-2">Start</th>
<th class="px-2">End</th>
</tr>
<tr>
<td class="px-2">{inputs.myRange}</td>
<td class="px-2">{inputs.myRange.value}</td>
<td class="px-2">{inputs.myRange.label}</td>

<td class="px-2">{inputs.myRange.start}</td>
<td class="px-2">{inputs.myRange.end}</td>
</tr>
</table>



## Remount Behvaior
<Checkbox name="toggleRange" title="Toggle Date Range" />

{#if inputs.toggleRange.value}
    <DateRange name="myRange2"/>

    🚩 This behavior is broken because DateRange does not support hydration

{/if}
<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>

<th class="px-2">Start</th>
<th class="px-2">End</th>
</tr>
<tr>
<td class="px-2">{inputs.myRange2}</td>
<td class="px-2">{inputs.myRange2.value}</td>
<td class="px-2">{inputs.myRange2.label}</td>

<td class="px-2">{inputs.myRange2.start}</td>
<td class="px-2">{inputs.myRange2.end}</td>
</tr>
</table>

## Query-Driven Behavior

🚩 Implement this