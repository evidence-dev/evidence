declare global {
	namespace svelteHTML {
		// enhance elements
		interface HTMLMetaAttributes {
			'evidence-query-presence'?: string;
			'evidence-query-content'?: string;
		}

		interface HTMLAttributes<T> {
			'evidence-query-name'?: string;
		}
	}
}
