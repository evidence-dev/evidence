import { evidenceLanguagePlugin } from './languagePlugin';
import { create as createHtmlService } from 'volar-service-html';
import { create as createCssService } from 'volar-service-css';
import { createServer, createConnection, createSimpleProject } from '@volar/language-server/node';

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
	return server.initialize(params, createSimpleProject([evidenceLanguagePlugin]), [
		createHtmlService(),
		createCssService()
	]);
});

connection.onInitialized(server.initialized);
connection.onShutdown(server.shutdown);
