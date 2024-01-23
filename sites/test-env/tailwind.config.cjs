const keppel = {
	50: '#f3faf7',
	100: '#d7f0e7',
	200: '#afe0d0',
	300: '#80c8b4',
	400: '#5eb09c',
	500: '#3c907d',
	600: '#2e7365',
	700: '#285d53',
	800: '#244b44',
	900: '#21403a',
	950: '#0e2521'
};

/** @type {import("tailwindcss").Config} */
module.exports = {
	theme: {
		extend: {
			colors: {
				keppel,
				blue: keppel
			}
		}
	}
};
