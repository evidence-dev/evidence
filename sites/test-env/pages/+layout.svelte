<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	export let data;
	import {addMapMiddleware} from "@evidence-dev/sdk/utils"
	import * as proto from "protomaps-leaflet";
	console.log({
		proto
	})
	addMapMiddleware(v => {
		const layer = proto.leafletLayer({url:'https://r2-public.protomaps.com/protomaps-sample-datasets/cb_2018_us_zcta510_500k.pmtiles',theme:"light"})
		layer.addTo(v)
		return v
	})
</script>

<EvidenceDefaultLayout {data} title="Evidence Test Environment">
	<slot slot="content" />
</EvidenceDefaultLayout>
