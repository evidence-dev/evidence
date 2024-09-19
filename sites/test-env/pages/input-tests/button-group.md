# Date Range DAG Test

## Basic Usage
<ButtonGroup name="myButtonGroup">
    <ButtonGroupItem value={1} valueLabel="One"/>
    <ButtonGroupItem value={2} valueLabel="Two"/>
    <ButtonGroupItem value={3} valueLabel="Three"/>
</ButtonGroup>

<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>
</tr>
<tr>
<td class="px-2">{inputs.myButtonGroup}</td>
<td class="px-2">{inputs.myButtonGroup.value}</td>
<td class="px-2">{inputs.myButtonGroup.label}</td>
</tr>
</table>


## Remount Behvaior
<Checkbox name="toggleRange" title="Toggle Date Range" />

{#if inputs.toggleRange}
    <ButtonGroup name="myButtonGroup2">
    <ButtonGroupItem value={1} valueLabel="One"/>
    <ButtonGroupItem value={2} valueLabel="Two"/>
    <ButtonGroupItem value={3} valueLabel="Three"/>
    </ButtonGroup>

{/if}
<table>
<tr>
<th class="px-2">Bare Usage (SQL Factory)</th>
<th class="px-2">Value</th>
<th class="px-2">Label</th>
</tr>
<tr>
<td class="px-2">{inputs.myButtonGroup2}</td>
<td class="px-2">{inputs.myButtonGroup2.value}</td>
<td class="px-2">{inputs.myButtonGroup2.label}</td>
</tr>
</table>

## Query-Driven Behavior

🚩 Implement this

## Behavior with defaults

🚩 Implement this