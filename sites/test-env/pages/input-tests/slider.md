# Date Range DAG Test

## Basic Usage
<Slider name="mySlider"/>

<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>
</tr>
<tr>
<td class="px-2">{inputs.mySlider}</td>
<td class="px-2">{inputs.mySlider.value}</td>
<td class="px-2">{inputs.mySlider.label}</td>
</tr>
</table>



## Remount Behvaior
<Checkbox name="toggleRange" title="Toggle Date Range" />

{#if inputs.toggleRange.value}
    <Slider name="mySlider2"/>

{/if}
<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>
</tr>
<tr>
<td class="px-2">{inputs.mySlider2}</td>
<td class="px-2">{inputs.mySlider2.value}</td>
<td class="px-2">{inputs.mySlider2.label}</td>
</tr>
</table>


## Query-Driven Behavior

🚩 Implement this