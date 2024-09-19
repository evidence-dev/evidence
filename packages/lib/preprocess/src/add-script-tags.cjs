/**
 * @type {import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
const addScriptTags = {
	markup({ content, filename }) {
		if (filename?.endsWith('.md')) {
			if (!content.match(/\<script(.*)\>/)) {
				const result =
					content + '\n\n<script context="module"> </script>\n\n<script> </script>\n\n';
				return { code: result };
			}
			if (!content.match(/\<script(.*)context\=\"module\"(.*)\>/)) {
				const result = content + '\n\n<script context="module"> </script>\n\n';
				return { code: result };
			}
			if (!content.match(/\<script\>/)) {
				const result = content + '\n\n<script> </script>\n\n';
				return { code: result };
			}
		}
	}
};

module.exports = addScriptTags;
