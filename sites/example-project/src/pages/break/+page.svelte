<script>
	throw new Error("I should be able to access this message", { cause: new Error("I should see the cause of the first level!", {cause: new Error("I should see the cause of the second level")}) } )
</script>