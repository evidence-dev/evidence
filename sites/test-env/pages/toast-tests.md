<script>
  // import {toasts} from "@evidence-dev/component-utilities/stores"
  
  /** @type {string} */
  let id;
  /** @type {string} */
  let title;
  /** @type {string} */
  let message;
  /** @type {number} */
  let timeout = 2000;
  /** @type { import("@evidence-dev/component-utilities/stores").ToastStatus } */
  let status;

  /**
   * @param {number} [times=1]
   */
  function addToast(times = 1) {
    for (let i = 0; i < times; i++ ) {
      toasts.add(
        { id, title, message, status },
        timeout
      )
    }
  }
  
</script>


<label class="flex gap-2 px-2 py-1 bg-gray-200 my-1 justify-between">
  ID
  <div>
  <input bind:value={id}/>
  <button class="bg-red-400 px-2 py-1" on:click={() => id = undefined}>Unset</button>
  </div>
</label>


<label class="flex gap-2 px-2 py-1 bg-gray-200 my-1 justify-between">
  Status
  <select bind:value={status}>
    <option value={undefined}>Undefined</option>
    <option value="error">Error</option>
    <option value="warning">Warning</option>
    <option value="success">Success</option>
    <option value="info">Info</option>
  </select>
</label>

<label class="flex gap-2 px-2 py-1 bg-gray-200 my-1 justify-between">
  Title
  <input bind:value={title}/>
</label>

<label class="flex gap-2 px-2 py-1 bg-gray-200 my-1 justify-between">
  Message
  <textarea bind:value={message}/>
</label>


<label class="flex gap-2 px-2 py-1 bg-gray-200 my-1 justify-between">
  Timeout
  <input type="number" bind:value={timeout}/>
</label>


<button class="bg-green-400 px-2 py-1 mx-1" on:click={() => addToast()}> Submit </button>
<button class="bg-green-400 px-2 py-1 mx-1" on:click={() => addToast(2)}> Submit 2x </button>
<button class="bg-green-400 px-2 py-1 mx-1" on:click={() => addToast(4)}> Submit 4x </button>
