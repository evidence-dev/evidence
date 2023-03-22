<svelte:head>
  {#if typeof metadata === "object"}
    <!-- <Frontmatter Processing> -->
    {#if metadata.title || metadata.og?.title}
      <title>{metadata.title ?? metadata.og?.title}</title>
      <meta
        property="og:title"
        content={metadata.og?.title ?? metadata.title}
      />
    {/if}
    {#if metadata.description || metadata.og?.description}
      <meta
        name="description"
        content={metadata.description ?? metadata.og?.description}
      />
      <meta
        property="og:description"
        content={metadata.og?.description ?? metadata.description}
      />
    {/if}
    {#if metadata.og?.image}
      <meta property="og:image" content={metadata.og?.image} />
    {/if}
    <!-- </Frontmatter Processing>-->
  {/if}
</svelte:head>
