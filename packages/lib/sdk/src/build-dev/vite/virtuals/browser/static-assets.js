export const getManifest = () => {
	return fetch('/_evidence/manifest.json').then((r) => r.text());
};
