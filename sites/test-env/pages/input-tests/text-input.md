# Date Range DAG Test

## Basic Usage
<TextInput name="myText"/>

<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>
</tr>
<tr>
<td class="px-2">{inputs.myText}</td>
<td class="px-2">{inputs.myText.value}</td>
<td class="px-2">{inputs.myText.label}</td>
</tr>
</table>


## Remount Behvaior
<Checkbox name="toggleRange" title="Toggle Date Range" />

{#if inputs.toggleRange.value}
    <TextInput name="myText2"/>

{/if}
<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>
</tr>
<tr>
<td class="px-2">{inputs.myText2}</td>
<td class="px-2">{inputs.myText2.value}</td>
<td class="px-2">{inputs.myText2.label}</td>
</tr>
</table>