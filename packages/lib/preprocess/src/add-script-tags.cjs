/**
 * @type {import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
const addScriptTags = {
	markup({ content, filename }) {
		if (filename.endsWith('.md')) {
			if (!content.match(/\<script(.*)\>/)) {
				return { code: '<script context="module"> </script>' + '<script> </script>' + content };
			}
			if (!content.match(/\<script(.*)context\=\"module\"(.*)\>/)) {
				return { code: '<script context="module"> </script>' + content };
			}
			if (!content.match(/\<script\>/)) {
				return { code: '<script> </script>' + content };
			}
		}
	}
};

module.exports = addScriptTags;
