<script>

    import formatTitle from '$lib/modules/formatTitle.js'

    export let name;
    export let value;
    export let label;

    if(!label){
        label = formatTitle(name)
    }

    import { variables } from '$lib/modules/stores.js';   

    $: varObj = {
        [name]: value
    }
    $: variables.update(d => { return {...d, ...varObj} });

    let typingMode = false;

    function whenFocused(e) {
        if(typingMode === false && e.key !== 'Tab' && e.key !== 'Shift'){
            typingMode = true;
            value = '';
        } else {
            if(e.key === "Enter"){
                console.log(e)
            const form = e.target.form;
            const index = [...form].indexOf(e.target);
            form.elements[index + 1].focus();
            e.preventDefault();            }
        }
    }

    function endFocus() {
        typingMode = false;
    }

</script>

<div class=calcRow>
<span class=label>{label}</span>
<input class="numin cell" class:typing={typingMode} on:keydown={(e) => whenFocused(e)} on:click={() => console.log('worked')} on:focusout={endFocus} bind:value type=number/>
</div>

<style>
    .calcRow {
        justify-items: space-between;
        margin-top: 4px;
        font-family: sans-serif;
        font-size: 14px;
        padding-left: 1px;
    }

    .label {
        /* padding-left: 1px; */
    }

    .numin {
        float: right;
        font-family: sans-serif;
        font-size: 14px;
        text-align: right;
        background-color: transparent;
        border: none;
        margin: auto 0 auto 0;
        color: blue;
    }

    input:focus {
    outline-width: 0;
}

.cell {
  border: 1.5px solid white;
  text-align: right;
  cursor: crosshair;
  caret-color: transparent;
  width: 60px;
  padding: 3px 8px 3px 0;
}

.cell:hover {
  border: 1.5px solid var(--grey-300);
  border-radius: 2px;
}

.cell:focus {
  border: 1.5px solid var(--grey-400);
  border-radius: 2px;
}

/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}

.typing {
    caret-color: var(--grey-600);
    cursor: auto;
}

</style>