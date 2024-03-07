export namespace bigQuerySchema {
    namespace project_id {
        let title: string;
        let type: string;
        let secret: boolean;
        let required: boolean;
        let references: string;
        let forceReference: boolean;
    }
    namespace authenticator {
        let title_1: string;
        export { title_1 as title };
        let type_1: string;
        export { type_1 as type };
        let secret_1: boolean;
        export { secret_1 as secret };
        export let nest: boolean;
        let required_1: boolean;
        export { required_1 as required };
        let _default: string;
        export { _default as default };
        export let options: {
            value: string;
            label: string;
        }[];
        export let children: {
            'service-account': {
                keyfile: {
                    title: string;
                    type: string;
                    fileFormat: string;
                    virtual: boolean;
                };
                client_email: {
                    title: string;
                    type: string;
                    secret: boolean;
                    required: boolean;
                    references: string;
                    forceReference: boolean;
                };
                private_key: {
                    title: string;
                    type: string;
                    secret: boolean;
                    required: boolean;
                    references: string;
                    forceReference: boolean;
                };
            };
            'gcloud-cli': {};
            oauth: {
                token: {
                    type: string;
                    title: string;
                    secret: boolean;
                    required: boolean;
                };
            };
        };
    }
}
//# sourceMappingURL=Options.fixtures.d.ts.map