<script> import {QueryLoad} from '@evidence-dev/core-components'; </script>
<MetricFilter metric="avg_sales"/>

<DataTable data={avg_sales}/>
<hr/>

<DataTable data={avg_sales.cut(['state', 'channel'], 'quarter').filter({ state: 'Missouri' })} />

<pre>{JSON.stringify(avg_sales.cut(['state']).chartSpec, null, 2)}</pre>
