<script>
  // Imported from https://github.com/magidoc-org/magidoc/tree/main/packages/plugins/svelte-prismjs
  import "../modules/prismPreconditions";
  import Prism from "prismjs";
  import PrismComponents from "prismjs/components";
  import "prismjs/themes/prism-okaidia.css";
  import "prismjs/plugins/line-numbers/prism-line-numbers";
  import "prismjs/plugins/line-numbers/prism-line-numbers.css";
  import "prismjs/plugins/toolbar/prism-toolbar";
  import "prismjs/plugins/toolbar/prism-toolbar.css";
  import "prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard";
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
   * Either to show the line numbers or not.
   * @type {boolean}
   */
  export let showLineNumbers = false;

  /**
   * Either to show the copy button or not.
   * @type {boolean}
   */
  export let showCopyButton = false;

  /**
   * A minimum height the code container should have.
   * By default, code section will fit the content's height..
   * @type {string}
   */
  export let minHeight;

  /**
   * A maximum height to restrict the code view into. In case of overflow, scrolling will be enabled.
   * By default, this is unrestricted.
   * @type {string}
   */
  export let maxHeight;

  /**
   * @type {HTMLElement}
   */
  let root;

  /**
   *
   * @param language {string}
   */
  async function ensureLanguage(language) {
    if (!Object.keys(Prism.languages).includes(language)) {
      if (!Object.keys(PrismComponents.languages).includes(language)) {
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
            `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${rl}.min.js`
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
</script>

<div
  class:prism--show-copy-button={showCopyButton}
  class:prism--hide-copy-button={!showCopyButton}
>
  <pre
    class:line-numbers={showLineNumbers}
    style:min-height={minHeight}
    style:max-height={maxHeight}><code bind:this={root} /></pre>
</div>

<style>
  :global(.prism--show-copy-button .copy-to-clipboard-button) {
    display: block;
  }

  :global(.prism--hide-copy-button .copy-to-clipboard-button) {
    display: none;
  }
  div {
    font-size: 0.8em;
  }
  code {
    background: transparent;
    border: transparent;
  }
</style>
