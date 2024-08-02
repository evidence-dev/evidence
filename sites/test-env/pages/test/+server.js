export const GET = async ({ request }) => {
    console.log({request})
    const r = new Request("https://r2-public.protomaps.com/protomaps-sample-datasets/cb_2018_us_zcta510_500k.pmtiles", request)
    console.log({r, response: await fetch})
    return new Response("Hello World!");
}