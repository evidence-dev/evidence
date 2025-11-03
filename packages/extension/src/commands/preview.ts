import { commands, workspace, Uri, ViewColumn, window } from 'vscode';

import { Commands } from './commands';
import { getExtensionContext } from '../extensionContext';
import { Settings, Context, getWorkspaceFolder, getConfig } from '../config';
import { getOutputChannel } from '../output';
import { telemetryService } from '../extension';

import { getAppPageUri, isServerRunning, startServer } from './server';

import { waitFor } from '../utils/httpUtils';

/**
 * Local Evidence app url.
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
 * @param uri Optional file location of the markdown document to preview.
 * No http/https Urls supported.
 *
 * @see Simple browser extension implementation:
 *  https://github.com/microsoft/vscode/pull/109276
 */
export async function preview(uri?: Uri) {
	// check if the open workspace has an Evidence project
	const isEvidenceProject = getExtensionContext().workspaceState.get(Context.HasEvidenceProject);

	// check if the Evidence dev server is running
	const isEvidenceServerRunning = await isServerRunning();

	if (!isEvidenceProject || !isEvidenceServerRunning) {
		// show standard markdown document preview
		commands.executeCommand(Commands.MarkdownShowPreview, uri);
		return;
	}

	// from this point on, we know this is an Evidence project with a server running
	if (!uri || uri.path === '/') {
		// open the default app page in the built-in simple browser webview
		const homePageUris = await getAppPageUri('/');
		// I suspect this to be causing the confusing message "Please reopen the preview"
		// openPageView(homePage);

		// to know when the server is ready to serve the page, we ping the local
		// uri of the page 
		await waitFor(homePageUris.internal.toString(true), 
			500, 30_000); // encoding, ms interval, max total wait time ms

		// call the built-in simple browser once more to load the home page content 
		// on server startup, note that this is a browser running on the local machine
		// and not the remote workspace environment.
		openPageView(homePageUris.external);
		return;
	}

	// from this point on, we know that "uri" is not 'undefined' or '/'
	const outputChannel = getOutputChannel();
	if (uri.scheme !== 'file') {
		// this should never happen
		outputChannel.appendLine(`Only document preview is supported, preview received: ${
			uri.toString(true)}`); // skip encoding
		return;
	} else {
		outputChannel.appendLine(`Requested document preview: ${
			uri?.fsPath}`); // skip encoding
	}

	// from this point on, we know it is file uri which we need to map to an external app url
	if (workspace.workspaceFolders) {
		let pageUrlPath = uri.fsPath;

		// get project folder root path
		const workspaceFolderPath: string = getWorkspaceFolder()!.uri.fsPath;

		// create web page url from file Uri by converting .md path to app page path
		pageUrlPath = pageUrlPath
			.replace(workspaceFolderPath, '')
			.split('\\')
			.join('/')
			.replace('/pages/', '')
			.replace('index.md', '')
			.replace('.md', '');
		pageUrlPath = `/${pageUrlPath}`;
		
		// create external app page Uri from page url path
		const pageUri: Uri = (await getAppPageUri(pageUrlPath)).external;
		
		// open requested page in the built-in simple browser webview
		openPageView(pageUri);
		return;
	}

	window.showErrorMessage('Preview is not possible without a folder opened.');
}

/**
 * Opens a page in the built-in VSCode Simple Browser webview.
 *
 * @param pageUri Uri of the page to open.
 */
export async function openPageView(pageUri: Uri) {
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
