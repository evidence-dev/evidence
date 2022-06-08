<script> 
import Parent from '$lib/contextstore/Parent.svelte'
import Child from '$lib/contextstore/Child.svelte'
import Sibling from '$lib/contextstore/Sibling.svelte'
</script>


<Parent prop=2>
</Parent>

<Parent prop=18>
<Child input={2202}/> 
</Parent>

<Parent prop=3>
<Child input={22}/> 
<Sibling input={11}/> 
</Parent>

