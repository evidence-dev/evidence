/*

    The Evidence SDK is designed to be used in many environments to prevent
        re-writing the same logic many times. With this in mind, there are
        several user interfaces where the same flow may occur (e.g. updating
        source configurations). In the CLI, a user may be prompted for some
        input using clack, whereas in the VS Code extension, they may be 
        prompted by the native UI.

    We want to provide a scaffolding for common workflow / ui patterns that
        can be provided by the _consumer_ of the flow to define how the user
        will interact with it. Classic dependency inversion!
        https://en.wikipedia.org/wiki/Dependency_inversion_principle

*/

export type EvidenceLoadIndicator = {
	start: (msg?: string) => void;
	stop: (msg?: string) => void;
	message: (msg?: string) => void;
};
