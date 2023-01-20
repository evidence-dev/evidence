<script>
	export let open = false
</script>

<button aria-label="hamburger menu" class:open on:click={() => open = !open}>
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
		z-index: 10;
        margin-top: 1.0em;
		margin-bottom: 1.0em;
		margin-left: 0.4em;
		margin-right: 1.5em;
        border: none;
		padding: 0px;
        text-align: center;
        text-decoration: none;
        font-size: 16px;
        background-color: hsla(217, 33%, 97%, 0);
	}

	button.open {
		margin-top: 0.8em;
		transition: all 0.1s ease-in;
	}
	
	.open svg {
		transform: scale(0.7);
	}

	svg {
		transform: scale(0.85);
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