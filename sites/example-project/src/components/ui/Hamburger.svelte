<script>
	export let open = false
</script>

<button class:open on:click={() => open = !open}>
	<svg width=32 height=24>
		<line id="top" x1=0 y1=2  x2=32 y2=2/>
		<line id="middle" x1=0 y1=12 x2=32 y2=12/>
		<line id="bottom" x1=0 y1=22 x2=32 y2=22/>
	</svg>
</button>

<style>
	svg {
		min-height: 24px;
		transition: transform 0.3s ease-in-out;
	}
	
	svg line {
		stroke: var(--grey-600);
		stroke-width: 3;
		transition: transform 0.3s ease-in-out
	}
	
	button {
		align-items: center;
		display: grid;
		grid-row: auto;
		grid-column: auto;
		z-index: 5;
        position:fixed;
        right: 0;
        top: 0; 
        margin: 1.0em;
        border: none;
        color: none;
        padding: 0px 11px 14px 11px;
        text-align: center;
        text-decoration: none;
        font-size: 16px;
        background-color: hsla(217, 33%, 97%, 0);
        border-radius: 4px;
	}
	
	.open svg {
		transform: scale(0.7);
	}
	
	.open #top {
		transform: translate(6px, -0.5px) rotate(45deg);
	}
	
	.open #middle {
		opacity: 0;
	}
	
    .open #bottom {
            transform: translate(-12px, 8px) rotate(-45deg)
        }

    @media (min-width: 850px) {
        button {
            display: none;
        }
    }

	@media print {
		button {
			display: none;
		}
  	}
</style>