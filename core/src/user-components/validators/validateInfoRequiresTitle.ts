export const validateInfoRequiresTitle = (ast: { attributes?: Record<string, unknown> }) => {
	const hasInfo = ast.attributes?.info;
	const hasTitle = ast.attributes?.title;

	if (hasInfo && !hasTitle) {
		return [
			{
				id: 'info-requires-title',
				level: 'error' as const,
				message: 'The "info" option can only be used when a "title" option is also provided.'
			}
		];
	}

	return [];
};
