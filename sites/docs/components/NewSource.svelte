<script>
  export let sourceName = "";
</script>

<h2 class="markdown">Add a New {sourceName} Data Source</h2>

<ol class="markdown">
  <li class="markdown">Start the Evidence dev server: <code class="markdown">npm run dev</code> or Start Evidence using the VSCode extension.</li>
  <li class="markdown">Navigate to the <a class="markdown" href="http://localhost:3000/settings">settings page</a>, also accessible via the <code class="markdown">...</code> menu in the top right.</li>
  <li class="markdown">Click the <b>New Source</b> button.</li>
  <li class="markdown">Select <b>{sourceName}</b> as the data source type.</li>
  <li class="markdown">Enter the <a class="markdown" href="#configuration">configuration options</a> for the connection.</li>
  <li class="markdown">Click the <b>Test</b> button to confirm the connection is successful.</li>
  <li class="markdown">Click the <b>Save</b> button to save the connection.</li>
  <li class="markdown">Your configuration options are saved in two files: 
    <ul class="markdown">
      <li class="markdown"><code class="markdown">/sources/[source_name]/connections.yaml</code>: Non-sensitive values, source controlled.</li>
      <li class="markdown"><code class="markdown">/sources/[source_name]/connection.options.yaml</code>: Sensitive values, not source controlled, base-64 encoded.</li>
    </ul>
  </li>
</ol>