import { ExtensionContext, Uri } from 'vscode';

/**
 * Extension context reference.
 *
 * @internal
 */
let extensionContext: ExtensionContext;

/**
 * Saves extension context reference.
 *
 * @param context Extension context.
 */
export function setExtensionContext(context: ExtensionContext) {
	extensionContext = context;
}

/**
 * Gets extension context reference.
 *
 * @returns Extension context.
 */
export function getExtensionContext(): ExtensionContext {
	return extensionContext;
}

/**
 * Gets extension file or folder Uri.
 *
 * @param relativeExtensionFilePath Relative extension file or folder path.
 *
 * @returns Extension file or folder Uri.
 */
export function getExtensionFileUri(relativeExtensionFilePath: string): Uri {
	return Uri.file(extensionContext.asAbsolutePath(relativeExtensionFilePath));
}
