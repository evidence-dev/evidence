
<script>
import CalcInput from '$lib/viz/CalcInput.svelte'
import CalcSubtotal from '$lib/viz/CalcSubtotal.svelte'
import CalcTotal from '$lib/viz/CalcTotal.svelte'
</script>

# Sales Analysis
Below is an estimate of the productivity of an individual sales rep at average productivity levels.

## Sales Model
Change the assumptions in this model just like in Excel - click a cell to edit it, then type in your assumption.
<CalcInput name=sales_per_day value=3/>
<CalcInput name=days_per_year value=5/>
<CalcSubtotal name=total_sales_per_rep value={$variables.days_per_year * $variables.sales_per_day}/>
<CalcInput name=number_of_reps value=31/>
<CalcTotal name=total_sales value={$variables.number_of_reps * $variables.total_sales_per_rep}/>


