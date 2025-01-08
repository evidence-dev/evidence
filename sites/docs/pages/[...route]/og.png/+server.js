import {html as toReactNode} from 'satori-html';
import SocialCard from '$lib/SocialCard.svelte';
export const prerender = true;
import fs from 'fs';
import path from 'path';

import satori from 'satori';
import {Resvg} from '@resvg/resvg-js';

const fontDataTight = fs.readFileSync(path.join(process.cwd(), 'src/components', 'InterTight-SemiBold.ttf'));
const fontData = fs.readFileSync(path.join(process.cwd(), 'src/components', 'Inter_24pt-Regular.ttf'));
const fontDataMono = fs.readFileSync(path.join(process.cwd(), 'src/components', 'GT-America-Mono-Regular.otf'));
const height = 600;
const width = 1200;


/** @type {import('./$types').RequestHandler} */
export const GET = async ({url, fetch}) => {
  // Fetch the pages manifest
  const manifestRes = await fetch('/api/pagesManifest.json');
  let tree = await manifestRes.json();
  let parent = undefined;
  // Get the frontmatter for the route by getting the route recursively using split('/') (trimming the /og.png)
  const route = url.pathname.replace('/og.png', '');
  let frontMatter = undefined;
  for (const part of route.split('/').slice(1)) {
    parent = tree;
    tree = tree.children[part];
    frontMatter = tree.frontMatter;
  }
  
  const title = frontMatter?.title || undefined;
  const description = frontMatter?.description || undefined;
  const category = parent?.frontMatter?.title || undefined;
  const result = SocialCard.render({title, description, category});
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
  const imageBuffer = await image.asPng();
  return new Response(imageBuffer, {
    headers: {
      'Content-Type': 'image/png'
    }
  });
};
