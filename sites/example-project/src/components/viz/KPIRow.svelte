<script>
    
    import { getContext } from 'svelte';
	import { propKey, strictBuild } from './context';

    let props = getContext(propKey);

    export let error;

    export let id;
    export let title = undefined;
    export let description = undefined;

    // Simple check of column name in dataset. Should be replaced with robust error handling in the future:
	$: checkColumnName();

/**
 * Check column name and handle error if doesn't exist
 */
	function checkColumnName() {
		try {
			if (!Object.keys($props.data[0]).includes(id)) {
				error = 'Error in table: ' + id + ' does not exist in the dataset';
				throw new Error(error);
			}
		} catch (e) {
			error = e.message;
			if (strictBuild) {
				throw error;
			}
		}
	}




    let options = {
		id: id,
		title: title,
        description: description,
	};


    props.update((d) => {
		d.columns.push(options);
		return d;
	});
</script>

