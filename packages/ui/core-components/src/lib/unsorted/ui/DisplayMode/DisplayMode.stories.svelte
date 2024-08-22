<script context="module">
	/** @type {import('@storybook/addon-svelte-csf').MetaProps}*/
	export const meta = {
		title: 'ui/DisplayMode',
		component: Checkbox
    };
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
    import DisplayMode from './DisplayMode.svelte';
    import Checkbox from '../../../atoms/inputs/checkbox/Checkbox.svelte';
    import Slider from '../../../atoms/inputs/slider/Slider.svelte';
    import DataTable from '$lib/unsorted/viz/table/_DataTable.svelte';
    import ButtonGroup from '$lib/atoms/inputs/button-group/ButtonGroup.svelte';
    import ButtonGroupItem from '$lib/atoms/inputs/button-group/ButtonGroupItem.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
    import DisplayInputs from './DisplayInputs.svelte';
    import DisplayComponents from './DisplayComponents.svelte';


    const planeData = Query.create(
		`
SELECT f.departure_date, SUM(f.fare) AS total_fare, CONCAT('https://www.google.com/search?q=', ANY_VALUE(f.plane)) as plane_url, f.plane
FROM (
    SELECT DISTINCT plane
    FROM flights
    LIMIT 2
) p
JOIN flights f ON p.plane = f.plane
GROUP BY f.departure_date, f.plane
LIMIT 200`,
		query
	);
</script>

<Story name="Basic">
    <DataTable data={planeData} />
    <DisplayMode >
        <DisplayInputs>
            <Checkbox
                title="Hide Months 0" 
                name=hide_months_0 
            />
            <Slider
            title="Months" 
            name=months
            defaultValue=18
            />
            <ButtonGroup name=hardcoded_options>
                <ButtonGroupItem valueLabel="Option One" value="1" />
                <ButtonGroupItem valueLabel="Option Two" value="2" />
                <ButtonGroupItem valueLabel="Option Three" value="3" />
            </ButtonGroup>
        </DisplayInputs>
        <DisplayComponents>
            <DataTable data={planeData} />
            <DataTable data={planeData} />
            <DataTable data={planeData} />
            <DataTable data={planeData} />
        </DisplayComponents>
    </DisplayMode >
</Story>
