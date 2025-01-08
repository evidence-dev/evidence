import {html as toReactNode} from 'satori-html';
import SocialCard from '$lib/SocialCard.svelte';
export const prerender = true;
import fs from 'fs';
import path from 'path';

import satori from 'satori';
import {Resvg} from '@resvg/resvg-js';

import InterTight from '$lib/InterTight-SemiBold.ttf';
const fontDataTight = fs.readFileSync(path.join(process.cwd(), 'src/components', 'InterTight-SemiBold.ttf'));
import Inter from '$lib/Inter_24pt-Regular.ttf';
const fontData = fs.readFileSync(path.join(process.cwd(), 'src/components', 'Inter_24pt-Regular.ttf'));
import GTAmericaMono from '$lib/GT-America-Mono-Regular.otf';
const fontDataMono = fs.readFileSync(path.join(process.cwd(), 'src/components', 'GT-America-Mono-Regular.otf'));
const height = 600;
const width = 1200;


/** @type {import('./$types').RequestHandler} */
export const GET = async ({url}) => {
  const title = url.searchParams.get('title') ?? undefined;
  const description = url.searchParams.get('description') ?? undefined;
  const code = url.searchParams.get('code') ?? undefined; 
  const category = url.searchParams.get('category') ?? undefined;
  const result = SocialCard.render({title, description, code, category});
  const element = toReactNode(`${result.html}<style>${result.css.code}</style>`);
  const svg = await satori(element, {
    height,
    width,
    fonts: [
      {
        name: 'Inter',
        data: await fontData,
        style: 'normal'
      },
      {
        name: 'InterTight',
        data: await fontDataTight,
        style: 'normal'
      },
      {
        name: 'GTAmericaMono',
        data: await fontDataMono,
        style: 'normal'
      },
    ]
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: width
    }
  });

  const image = resvg.render();

  return new Response(image.asPng(), {
    headers: {
      'content-type': 'image/png'
    }
  });
};