<script>
	export let color = 'hsla(207, 65%, 39%, 1)';
	export let id;
	export let label;
	export let activeId;

	const classes = {
		notActive:
			'border-gray-100 text-gray-600 border-b-2 bg-gray-50 border-b-gray-200 hover:text-gray-800 hover:bg-gray-200 hover:border-b-gray-400',
		active: 'text-black border-b-2 border-[--borderColor] bg-[--bgColor]'
	};

	color = color.replace(/\s+/g, ''); // clean string

	const bgColor = isValidColorString(color) ? addOpacityToColor(color) : 'hsla(207, 65%, 39%, 0.1)';
	const borderColor = isValidColorString(color) ? color : 'hsla(207, 65%, 39%, 1)';

	function isHex(inputColor) {
		const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/i;
		return hexRegex.test(inputColor);
	}

	function isRGB(inputColor) {
		const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
		return rgbRegex.test(inputColor);
	}

	function isHSL(inputColor) {
		const hslRegex = /^hsl\(\s*(\d{1,3}%)\s*,\s*(\d{1,3}%)\s*,\s*(\d{1,3}%)\s*\)$/i;
		return hslRegex.test(inputColor);
	}

	function isValidColorString(inputColor) {
		return isHex(inputColor) || isRGB(inputColor) || isHSL(inputColor);
	}

	function addOpacityToColor(colorString) {
		if (isHex(colorString)) {
			return colorString + '1a';
		} else if (isRGB(colorString) || isHSL(colorString)) {
			return colorString.replace(/(\)|\s|$)/, ', 0.1$1');
		}
	}
</script>

<button
	style:--bgColor={bgColor}
	style:--borderColor={borderColor}
	on:click
	class="mt-2 p-2 rounded-t flex-1 text-sm font-sans whitespace-nowrap transition ease-in duration-200 active:bg-gray-100 {activeId ===
	id
		? classes.active
		: classes.notActive}"
>
	{label}
</button>
