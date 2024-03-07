declare global {
    namespace svelteHTML {
        interface HTMLMetaAttributes {
            'evidence-query-presence'?: string;
            'evidence-query-content'?: string;
        }
        interface HTMLAttributes<T> {
            'evidence-query-name'?: string;
        }
    }
}
export {};
//# sourceMappingURL=html-attributes.d.ts.map