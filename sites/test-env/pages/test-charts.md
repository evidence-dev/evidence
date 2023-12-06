<script>
    import {genSeries} from "@evidence-dev/component-utilities/tests/getCompletedData.fixture"
</script>

Testing
<Accordion>
{#each ['number', 'date', 'category'] as xType}
{#each [true, false] as xHasGaps}
{#each [true, false] as yHasNulls}
{#each [true, false] as seriesAlwaysExists}
{@const opts = {xHasGaps, yHasNulls, seriesAlwaysExists, maxSeriesCount: 2, minSeriesLen: 50, maxSeriesLen: 50, maxInterval: 1, maxOffset: 0, xType}}
{@const label = Object.entries(opts).map(kv => kv.join('=')).join(', ')}
<AccordionItem title={label}>

                    {@const data = genSeries(opts)}
                    <DataTable data={data.data}/>
                    {#each ['zero', 'connect', 'gap'] as handleMissing}

                        <h3 class="markdown">{Object.entries({handleMissing}).map(kv => kv.join("=")).join(", ")}</h3>

                        <Accordion>
                            <AccordionItem title="Line Charts">

                                With Series
                                <LineChart data={data.data} series="series" y={data.keys.y} x={data.keys.x} {handleMissing}/>
                                Without Series
                                <LineChart data={data.data} y={data.keys.y} x={data.keys.x} {handleMissing}/>
                            </AccordionItem>


                            <AccordionItem title="Area Charts">
                                With Series
                                <AreaChart data={data.data} series="series" y={data.keys.y} x={data.keys.x} {handleMissing}/>
                                Without Series
                                <AreaChart data={data.data} y={data.keys.y} x={data.keys.x} {handleMissing}/>
                            </AccordionItem>

                            <AccordionItem title="Bar Charts">
                                With Series
                                <BarChart data={data.data} series="series" y={data.keys.y} x={data.keys.x} {handleMissing}/>
                                Without Series
                                <BarChart data={data.data} y={data.keys.y} x={data.keys.x} {handleMissing}/>
                            </AccordionItem>
                        </Accordion>


                {/each}
            </AccordionItem>
            {/each}
        {/each}
    {/each}

{/each}
</Accordion>
