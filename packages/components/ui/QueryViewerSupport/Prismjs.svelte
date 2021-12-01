<script>
  import "./prismtheme.css"
    
  import { blur, slide, fly, fade} from 'svelte/transition';

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
  <pre in:blur|local>
    <code class="language-{language}">{code}</code>
  </pre>
<style>
    pre {
      margin: 0 0 0 0; /* Makes the block jump around on transition */  
      font-size:12px;
      display: block;
    }   
</style>