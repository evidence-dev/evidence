import { evidenceLanguagePlugin } from './languagePlugin';
import { createServer, createConnection, createSimpleProject } from '@volar/language-server/node';
import { svelte } from './svelte-service';

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
	return server.initialize(params, createSimpleProject([evidenceLanguagePlugin]), [svelte]);
});

connection.onInitialized(server.initialized);
connection.onShutdown(server.shutdown);
