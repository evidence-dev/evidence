import { commands, workspace, Uri, ViewColumn } from 'vscode';

import { Commands } from './commands';
import { getExtensionContext } from '../extensionContext';
import { Settings, Context, getWorkspaceFolder, getConfig } from '../config';
import { getOutputChannel } from '../output';
import { telemetryService } from '../extension';

import { getAppPageUri, isServerRunning, startServer } from './server';

import { waitFor } from '../utils/httpUtils';

/**
 * Gets the base Evidence app URL using configuration settings.
 */
export function getLocalAppUrl(): string {
	const allowedHost: string = getConfig(Settings.AllowedHost, '') as string;
	const basePath: string = getConfig(Settings.BasePath, '') as string;

	if (allowedHost) {
		// Use the configured host (e.g., for code-server or reverse proxy)
		const protocol = allowedHost.includes('localhost') ? 'http' : 'https';
		return `${protocol}://${allowedHost}${basePath}`;
	} else {
		// Default to localhost
		return `http://localhost${basePath}`;
	}
}

/**
 * Legacy export for backward compatibility.
 * @deprecated Use getLocalAppUrl() instead
 */
export const localAppUrl = `http://localhost`;

/**
 * Opens a markdown document Preview webview.
 *
 * Uses the built-in vscode markdown document preview webview
 * for the standard markdown documents, and .md documents
 * not in the Evidence /pages/ folder.
 *
 * For the Evidence markdown documents in the /pages/ folder,
 * opens the requested app page in the built-in simple browser webview.
 *
 * @param uri Optional Uri of the markdown document to preview.
 *
 * @see Simple browser extension implementation:
 *  https://github.com/microsoft/vscode/pull/109276
 */
export async function preview(uri?: Uri) {
	// default page url
	let pageUrl: string = '/';

	// check if the open workspace has an Evidence project
	const isEvidenceProject = getExtensionContext().workspaceState.get(Context.HasEvidenceProject);

	if ((!uri || uri.path === '/') && isEvidenceProject && isServerRunning()) {
		// open the default app page in the built-in simple browser webview
		const homePage: Uri = await getAppPageUri('/');
		openPageView(homePage);

		// wait for the server to load the app home page
		await waitFor(homePage.toString(true), 1000, 30000); // encoding, ms interval, max total wait time ms

		// call the built-in simple browser once more
		// to load the home page content on server startup
		openPageView(homePage);
		return;
	}

	if (uri) {
		// log preview document or page request in output channel for troubleshooting
		const outputChannel = getOutputChannel();
		if (uri.scheme === 'file ') {
			outputChannel.appendLine(`Requested document preview: ${uri.fsPath}`); // skip encoding
		} else if (uri.scheme === 'http' || uri.scheme === 'https') {
			// must be a valide http or https
			outputChannel.appendLine(`Requested page preview: ${uri.path}`); // skip encoding
		}
	}

	if (!isEvidenceProject || !isServerRunning() || !/\/pages\/|\\pages\\/.test(uri?.path ?? '')) {
		// show standard markdown document preview
		commands.executeCommand(Commands.MarkdownShowPreview, uri);
		return;
	}

	// create web page url from page Uri
	if (uri && (uri.scheme === 'http' || uri.scheme === 'https')) {
		pageUrl = uri.toString(true); // skip encoding
	} else if (
		uri &&
		uri.scheme === 'file' &&
		workspace.workspaceFolders &&
		isEvidenceProject &&
		isServerRunning()
	) {
		// get project folder root path
		const workspaceFolderPath: string = getWorkspaceFolder()!.uri.fsPath;

		// create web page url from file Uri by converting .md path to app page path
		let pagePath: string = uri.fsPath
			.replace(workspaceFolderPath, '')
			.split('\\')
			.join('/')
			.replace('/pages/', '')
			.replace('index.md', '')
			.replace('.md', '');
		pageUrl = `/${pagePath}`;
	}

	// create external app page Uri from page url
	const pageUri: Uri = await getAppPageUri(pageUrl);

	// open requested page in the built-in simple browser webview
	openPageView(pageUri);
}

/**
 * Opens a page in the built-in VSCode Simple Browser webview.
 *
 * @param pageUri Uri of the page to open.
 */
async function openPageView(pageUri: Uri) {
	const previewType: string = <string>getConfig(Settings.PreviewType);

	if (pageUri) {
		// open requested page in the built-in simple browser webview to side
		commands.executeCommand(Commands.OpenSimpleBrowser, pageUri.toString(true), {
			viewColumn: previewType === 'internal' ? ViewColumn.Active : ViewColumn.Two,
			preserveFocus: true
		});
		telemetryService?.sendEvent('openSimpleBrowser');
	}
}
