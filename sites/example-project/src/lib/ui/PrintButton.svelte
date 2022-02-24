<button class="save-pdf" onClick="print()">Download PDF</button>

<style>
    .save-pdf {
        background-color:var(--blue-600); 
        color: white; 
        border-radius: 4px; 
        border-width: 0; 
        padding: 4px 10px 4px 10px;
        font-family: var(--ui-font-family);
        transition: all 400ms ease-out ;
        font-weight:bold;
    }

    .save-pdf:hover {
        background-color:var(--blue-700); 
        cursor: pointer;
        transition: all 400ms ease-out ;
    }

    .save-pdf:active {
        outline: none;
    }
</style>
