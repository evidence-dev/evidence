<script>
  import "./prismtheme.css"
    
  import { blur } from 'svelte/transition';

  import { onMount } from 'svelte';
  
  export let language;
  export let code;
 
  onMount(() => {

   let script = document.createElement('script');
   script.src = "https://tutsplus.github.io/syntax-highlighter-demos/highlighters/Prism/prism.js"
   document.head.append(script);

   script.onload = function() {

     let langJS = false;
     let lang_script;
     let lang_module;

     // This switch statement, evaluates what language is being used, if one of a key language is being used, it will
     // load the proper Prisim support tool, like Python requires "prism-python.js" to modify the raw code so that
     // Prisim can render it properly.
     switch (language) {

       case "json":
         lang_module = "https://prismjs.com/components/prism-json.js"
         langJS = true;
         break    

       case "python":
         lang_module = "https://prismjs.com/components/prism-python.js"
         langJS = true;
         break                

       case "rust":
         lang_module = "https://prismjs.com/components/prism-rust.js"
         langJS = true;
         break   

       case "r":
         lang_module = "https://prismjs.com/components/prism-r.js"
         langJS = true;
         break   

       case "sql":
         lang_module = "https://prismjs.com/components/prism-sql.js"
         langJS = true;
         break           
     }

     if (langJS == true) {

        lang_script = document.createElement('script');
        lang_script.src = lang_module
        lang_script.async = true
        document.head.append(lang_script);

        lang_script.onload = () => {
          Prism.highlightAll();
         }

     }
     else {
       Prism.highlightAll();
     }

   };

  });

</script>
  <pre in:blur>
    <code class="language-{language}">{code}</code>
  </pre>
<style>

    :root {
      --scrollbar-track-color: transparent;
      --scrollbar-color: rgba(0,0,0,.2);
      --scrollbar-active-color: rgba(0,0,0,.4);
      --scrollbar-size: .75rem;
      --scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical) */
    }

    pre {
      margin: 0 0 0 0; /* Makes the block jump around on transition */  
      font-size:12px;
      display: block;
      scrollbar-width: thin; 
      scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
    }   

    pre::-webkit-scrollbar {
      height: var(--scrollbar-size);
      width: var(--scrollbar-size);
    }
    pre::-webkit-scrollbar-track {
      background-color: var(--scrollbar-track-color);
    }
    pre::-webkit-scrollbar-thumb {
      background-color: var(--scrollbar-color);
      border-radius: 7px;
      background-clip: padding-box;
    }
    pre::-webkit-scrollbar-thumb:hover {
      background-color: var(--scrollbar-active-color);
    }
    pre::-webkit-scrollbar-thumb:vertical {
      min-height: var(--scrollbar-minlength);
      border: 3px solid transparent;
    }
    pre::-webkit-scrollbar-thumb:horizontal {
      min-width: var(--scrollbar-minlength);
      border: 3px solid transparent;
    }
    code {
      display: inline-block;
    }
</style>