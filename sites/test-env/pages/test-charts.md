<script>
    import {genSeries} from "@evidence-dev/component-utilities/tests/getCompletedData.fixture"
</script>

Testing
<Accordion>
{#each ['number', 'date'] as xType}
{#each [true, false] as xHasGaps}
{#each [true, false] as yHasNulls}
{#each [true, false] as seriesAlwaysExists}
{@const opts = {xHasGaps, yHasNulls, seriesAlwaysExists, maxSeriesCount: 2, minSeriesLen: 50, maxSeriesLen: 50, maxInterval: 1, maxOffset: 0, xType}}
{@const label = Object.entries(opts).map(kv => kv.join('=')).join(', ')}
<AccordionItem title={label}>

                    {@const data = genSeries(opts).data}
                    <DataTable {data}/>
                    {#each ['zero', 'connect', 'gap'] as handleMissing}

                    <h3 class="markdown">{Object.entries({handleMissing}).map(kv => kv.join("=")).join(", ")}</h3>


                    <h4>Line Charts</h4>
                    With Series
                    <LineChart {data} series="series" y=value x=time {handleMissing}/>
                    Without Series
                    <LineChart {data} y=value x=time {handleMissing}/>


                    <h4>Area Charts</h4>
                    With Series
                    <AreaChart {data} series="series" y=value x=time {handleMissing}/>
                    Without Series
                    <AreaChart {data} y=value x=time {handleMissing}/>

                {/each}
            </AccordionItem>
            {/each}
        {/each}
    {/each}

{/each}
</Accordion>
