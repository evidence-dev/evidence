<script>
  import { addBasePath } from "@evidence-dev/sdk/utils/svelte";
</script>


# Image

## Adding the base path manually (works)
<img src={addBasePath("/twitter-card-black-bg.png")} alt="Twitter Card" />

## Without adding the base path
<img src="/twitter-card-black-bg.png" alt="Twitter Card" />

## Using markdown
![Twitter Card](/twitter-card-black-bg.png)
