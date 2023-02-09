<script>
    // Imported from https://github.com/magidoc-org/magidoc/tree/main/packages/plugins/svelte-prismjs
    import "../modules/prismPreconditions";
  import Prism from "prismjs";
  import PrismComponents from "prismjs/components";
  import "./QueryViewerSupport/prismtheme.css"
  import "prismjs/plugins/line-numbers/prism-line-numbers";
  import "prismjs/plugins/line-numbers/prism-line-numbers.css";
  import "prismjs/plugins/line-highlight/prism-line-highlight";
  import "./QueryViewerSupport/prism-line-highlight.css";
  /**
   * The target language to use. This language must be imported manually from prism to be activated.
   * @type {string}
   */
  export let language;
  /**
   * The source code to highlight.
   * @type {string}
   */
  export let source;
  /**
   * Lines to highlight.
   * @type {string}
   */
   export let highlightLines;
  /**
   * A minimum height the code container should have.
   * By default, code section will fit the content's height..
   * @type {string}
   */
  // export let minHeight;
  /**
   * A maximum height to restrict the code view into. In case of overflow, scrolling will be enabled.
   * By default, this is unrestricted.
   * @type {string}
   */
  // export let maxHeight;
  /**
   * @type {HTMLElement}
   */
  let root;
  /**
   * This function ensures that all dependencies for a language
   * have been loaded before attempting to render it.
   * @param language {string}
   */
  async function ensureLanguage(language) {
    if (!Object.keys(Prism.languages).includes(language)) {
      if (!Object.keys(PrismComponents.languages).includes(language)) {
        // "code" explicitly does not support syntax highlighting.
        if (language !== "code")
          console.warn(
            `Highlighting for language ${language} is not supported. If you have abbreviated the language, try using the full name (e.g. python instead of py).`
          );
        return;
      }
      const requiredLanguages = new Set();
      /**
       * Some languages (i.e. pug) have dependencies on other languages being loaded.
       * This function is responsible for ensuring that the target language, along with it's dependencies
       * have been properly loaded from the cdn.
       * @param language {string}
       */
      function collectRequirements(language) {
        requiredLanguages.add(language);
        // Identify what the requirements are
        const { require: r = [] } = PrismComponents.languages[language] ?? {};
        if (Array.isArray(r)) {
          for (const lang of r) {
            if (!requiredLanguages.has(lang)) {
              // Recurse to check for multi-level dependencies.
              collectRequirements(lang);
            }
          }
        } else {
          if (!requiredLanguages.has(r)) {
            // Recurse to check for multi-level dependencies.
            collectRequirements(r);
          }
        }
      }
      // Ensure that we have a full list of languages to load for support
      collectRequirements(language);
      await Promise.all(
        Array.from(requiredLanguages).map(async (rl) =>
          // Dynamically load all required languages from the cdn
          // This cannot be loaded from node_modules because it is interpolated.
          import(
            `../../../../node_modules/prismjs/components/prism-${rl}.min.js`
          )
        )
      );
    }
  }
  /**
   *
   * @param root {HTMLElement}
   * @param language {string}
   * @param source {string}
   */
  async function highlight(root, language, source) {
    // The _ (language) parameter is important to force Svelte to reload if the language change
    await ensureLanguage(language);
    // This is the way found to make PrismJS re-render on change
    // and also keep the toolbar working
    root.textContent = source.trim();
    // Clear class list and add the new language in it
    // Looks hacky, but since this component can be re-used,
    // it is important that the class is added before highlighting,
    // which is not always the case if done inside the html template.
    root.classList.forEach((item) => {
      if (item.startsWith("language")) {
        root.classList.remove(item);
      }
    });
    if (language) {
      root.classList.add(`language-${language}`);
    }
    Prism.highlightElement(root);
  }
  $: {
    if (root && Prism) {
      highlight(root, language, source);
    }
  }
  
  export let copyToClipboard = true;
  import Copy from "./Deployment/CopyIcon.svelte";
  import Success from "./Deployment/CopySuccessIcon.svelte";
  let copied = false;

  const toggleCopied = function () {
    copied = false;
  };

  export let copy = async (text) => {
    try {
      if (!copied) {
        await navigator.clipboard.writeText(text);
        copied = true;
        setTimeout(toggleCopied, 1500);
      }
    } catch (e) {}
  };
</script>

<pre data-line={highlightLines}><code bind:this={root}></code>
{#if copyToClipboard}
<button
  type="button"
  class="container"
  class:copied
  on:click={() => {
    if (source !== undefined) {
      copy(source);
    }
  }}>{#if copied}<Success color=var(--green-500)/>{:else}<Copy/>{/if}</button>
{/if}
</pre>

<style>
  pre {
    overflow: scroll;
    background: var(--grey-100);
    border: 1px solid var(--grey-200);
    border-radius: 5px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    padding: 0.1em 0em;
    line-height: 1.05em;
  }

  pre code {
    display: block;
    background: none;
    border: none;
    padding: 0.8em 0.8em;
    color: var(--grey-900);
    font-size: 0.7em;
  }

  pre button.container {
        opacity: 0;
        transition: all 200ms ease-in-out;
        box-sizing: border-box;
        background-color: var(--grey-100);
        border-radius: 4px 4px 4px 4px;
        border: 1px solid var(--grey-300);
        padding: 0.25em 0.35em 0.25em 0.35em;
        color: var(--grey-300);
        size: 0.75em;
        width: 2.4em;
        height: 2.4em;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        margin: 0.5em;
        display: flex;
        align-items: center;
        justify-content: center;
    }



  pre:hover button.container {
        opacity: 1;
        transition: all 200ms ease-in-out;
        box-sizing: border-box;
        background-color: var(--grey-100);
        border-radius: 4px 4px 4px 4px;
        border: 1px solid var(--grey-300);
        padding: 0.25em 0.35em 0.25em 0.35em;
        color: var(--grey-300);
        size: 0.75em;
        width: 2.4em;
        height: 2.4em;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        margin: 0.5em;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    pre button.container:hover {
        border-color: var(--grey-500);
        background-color: var(--grey-100);
        color: var(--grey-500);
        transition: all 200ms ease-in-out;
    }
    


    pre button.container.copied {
        border-color: var(--grey-500);
        background-color: var(--grey-100);
        color: var(--green-500);
        transition: all 200ms ease-in-out;
    }
</style>


