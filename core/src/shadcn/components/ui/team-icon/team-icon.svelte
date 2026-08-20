<script lang="ts">
	function generateGradient(name: string) {
		// Generate two hues from the team name using different hash functions
		const hash1 = name.split('').reduce((acc, char, i) => {
			return char.charCodeAt(0) * (i + 1) + ((acc << 5) - acc);
		}, 0);

		const hash2 = name.split('').reduce((acc, char, i) => {
			return char.charCodeAt(0) * (i + 2) + ((acc << 7) - acc);
		}, 0);

		const hue1 = Math.abs(hash1 % 360);
		const hue2 = Math.abs(hash2 % 360);

		return `background-image: linear-gradient(to bottom right, hsl(${hue1},70%,60%), hsl(${hue2},70%,60%))`;
	}

	let { name, size = '8' } = $props();
</script>

<div class="size-{size} rounded-lg" style={generateGradient(name)}></div>
