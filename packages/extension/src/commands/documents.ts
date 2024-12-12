import { workspace, window, Uri } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { telemetryService } from '../extension';
import { getPackageJsonFolder } from '../utils/jsonUtils';

function capitalizeWords(str: string) {
	return str
		.toLowerCase()
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.substring(1))
		.join(' ');
}

export async function createTemplatedPageFromQuery() {
	telemetryService?.sendEvent('createTemplatedPageFromQuery');
	const activeEditor = window.activeTextEditor;
	if (
		!activeEditor ||
		!activeEditor.document.fileName.endsWith('.sql') ||
		!activeEditor.document.fileName.includes(
			`${path.sep}queries${path.sep}`
		)
	) {
		window.showWarningMessage(
			`This command can only be run from within a .sql file in your 'queries' folder`,
			{ modal: true }
		);
		telemetryService?.sendEvent('createTemplatedPageSqlWarning');
		return;
	}

	const columnName = await window.showInputBox({
		prompt:
			'Enter the column name containing the identifier for your templated items (e.g., customer_id)'
	});
	if (!columnName) {
		return; // User cancelled the input box
	}

	const workspaceFolders = workspace.workspaceFolders;
	if (!workspaceFolders) {
		window.showErrorMessage('No workspace folder is open.');
		return;
	}

	// check if evidence project is in subdirectory:
	const packageJsonFolder = await getPackageJsonFolder();

	const projectRoot = workspaceFolders[0].uri.fsPath;
	const sqlFileName = path.basename(activeEditor.document.fileName, '.sql');
	const newFolderPath = path.join(projectRoot, packageJsonFolder ?? '', 'pages', sqlFileName);
	fs.mkdirSync(newFolderPath, { recursive: true });

	const indexPath = path.join(newFolderPath, 'index.md');
	const columnFilePath = path.join(newFolderPath, `[${columnName}].md`);

	const indexContent = `---\ntitle: ${capitalizeWords(sqlFileName)}\nqueries:\n   - ${sqlFileName}: ${sqlFileName}.sql\n---\n\nClick on an item to see more detail\n\n\n\`\`\`sql ${sqlFileName}_with_link\nselect *, '/${sqlFileName}/' || ${columnName} as link\nfrom \$\{${sqlFileName}\}\n\`\`\`\n\n<DataTable data={${sqlFileName}_with_link} link=link/>\n`;
	const columnFileContent = `---\nqueries:\n   - ${sqlFileName}: ${sqlFileName}.sql\n---\n\n# {params.${columnName}}\n\n\`\`\`sql ${sqlFileName}_filtered\nselect * from \$\{${sqlFileName}\}\nwhere ${columnName} = '\$\{params.${columnName}\}'\n\`\`\`\n\n<DataTable data={${sqlFileName}_filtered}/>\n`;

	fs.writeFileSync(indexPath, indexContent);
	fs.writeFileSync(
		columnFilePath,
		columnFileContent
	);

	// Open the templated markdown file
	const columnFileUri = Uri.file(columnFilePath);
	const document = await workspace.openTextDocument(columnFileUri);
	await window.showTextDocument(document);
	telemetryService?.sendEvent('templatedPageCreated');
}


export async function addCustomLayout() {
	telemetryService?.sendEvent('addCustomLayout');

	// Get the workspace folder and ensure it is open
	const workspaceFolders = workspace.workspaceFolders;
	if (!workspaceFolders) {
		window.showErrorMessage('No workspace folder is open.');
		return;
	}

	// Define the source and destination paths
	const workspaceRoot = workspaceFolders[0].uri.fsPath;
	const packageJsonFolder = await getPackageJsonFolder();
	const projectRoot = path.join(workspaceRoot, packageJsonFolder ?? '');

	const sourceFilePath = path.join(
		projectRoot,
		'.evidence',
		'template',
		'src',
		'pages',
		'+layout.svelte'
	);
	const destinationFolderPath = path.join(projectRoot, 'pages');
	const destinationFilePath = path.join(destinationFolderPath, '+layout.svelte');

	// Check if the source file exists
	if (!fs.existsSync(sourceFilePath)) {
		window.showErrorMessage(
			`Layout template file not found in ${sourceFilePath}. Run the server to populate this file.`
		);
		return;
	}

	// Check if the destination file already exists
	if (fs.existsSync(destinationFilePath)) {
		const overwrite = await window.showWarningMessage(
			`The file ${destinationFilePath} already exists. Do you want to overwrite it?`,
			{ modal: true },
			'Yes',
			'No'
		);
		if (overwrite !== 'Yes') {
			window.showInformationMessage('Custom layout addition cancelled');
			return;
		}
	}

	// Ensure the destination folder exists
	fs.mkdirSync(destinationFolderPath, { recursive: true });

	// Copy the layout file to the destination
	try {
		fs.copyFileSync(sourceFilePath, destinationFilePath);
		window.showInformationMessage(
			`Custom layout added successfully at: ${destinationFilePath}`
		);
		telemetryService?.sendEvent('customLayoutAdded');
	} catch (error) {
		console.error(error);
		window.showErrorMessage('Failed to add custom layout.');
	}
}
