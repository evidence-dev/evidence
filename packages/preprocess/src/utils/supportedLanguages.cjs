module.exports = {
	// Case insensitive
	// If you are changing this, update the inlined version in api/status/[...route]/extractQueries.server.js
	supportedLangs: [
		'JavaScript',
		'HTML',
		'CSS',
		'SQL',
		'Python',
		'TypeScript',
		'Java',
		'Bash',
		'CSharp',
		'C++',
		'PHP',
		'C',
		'PowerShell',
		'Go',
		'Rust',
		'Kotlin',
		'Dart',
		'Ruby',
		'R',
		'MATLAB',
		'DAX',
		'JSON',
		'YAML',
		'Markdown',
		'Code',
		'Svelte',
		'Shell'
	].map((r) => r.toLowerCase())
};
