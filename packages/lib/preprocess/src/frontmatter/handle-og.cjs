module.exports = `
<!-- 
    MDSvex comes in handy here because it takes frontmatter and shoves it into the metadata object.
    This means that all we need to do is build out the expected page metadata
-->
<!-- Show title as h1 if defined, and not hidden -->
{#if typeof metadata !== "undefined" && (metadata.title || metadata.og?.title) && metadata.hide_title !== true}
<h1 class="title">{metadata.title ?? metadata.og?.title}</h1>
{/if}
<svelte:head>
<!-- Title has a default case; so we need to handle it in a special way -->
{#if typeof metadata !== "undefined" && (metadata.title || metadata.og?.title)}
<title>{metadata.title ?? metadata.og?.title}</title>
<meta property="og:title" content={metadata.og?.title ?? metadata.title} />
<meta name="twitter:title" content={metadata.og?.title ?? metadata.title} />
{:else}
<!-- EITHER there is no metadata, or there is no specified style -->
<title>Evidence</title>
{/if}

<!-- default twitter cardtags -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@evidence_dev" />

{#if typeof metadata === "object"}
{#if metadata.description || metadata.og?.description}
  <meta
    name="description"
    content={metadata.description ?? metadata.og?.description}
  />
  <meta
    property="og:description"
    content={metadata.og?.description ?? metadata.description}
  />
  <meta
    name="twitter:description"
    content={metadata.og?.description ?? metadata.description}
  />
{/if}
{#if metadata.og?.image}
  <meta property="og:image" content={addBasePath(metadata.og?.image)} />
  <meta name="twitter:image" content={addBasePath(metadata.og?.image)} />
{/if}
{/if}
</svelte:head>
`;
