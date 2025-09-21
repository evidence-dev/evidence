import * as http from 'http';
import * as https from 'https';

import { getOutputChannel } from '../output';
import { timeout } from './timer';

/**
 * Checks local server for a free port.
 *
 * @param port Port number to check.
 *
 * @returns True if port is free and false otherwise.
 */
export async function isPortFree(port: number) {
	return new Promise((resolve) => {
		const server = http
			.createServer()
			.listen(port, () => {
				server.close();
				resolve(true);
			})
			.on('error', () => {
				resolve(false);
			});
	});
}

/**
 * Tries to find a free port recursively.
 *
 * @param port Starting port number, set to the default value to start from 3000.
 *
 * @returns Available port number or the next port nubmer to try.
 */
export async function tryPort(port = 3000): Promise<number> {
	if (await isPortFree(port)) {
		const outputChannel = getOutputChannel();
		outputChannel.appendLine(`\nUsing server port: ${port} ...`);
		return port;
	}
	return tryPort(port + 1);
}

/**
 * Pings a url to check if it's up.
 *
 * @param url The url to ping.
 * @returns Url ping result promise.
 */
export function ping(url: string) {
	const promise = new Promise<boolean>((resolve) => {
		const useHttps = url.indexOf('https') === 0;
		const request = useHttps ? https.request : http.request;

		// log requsted page Url in the Evidence output channel view for troubleshooting
		const outputChannel = getOutputChannel();
		outputChannel.appendLine(`Pinging page: ${url}`);

		const pingRequest = request(url, () => {
			resolve(true);
			pingRequest.destroy();
		});

		pingRequest.on('error', () => {
			resolve(false);
			pingRequest.destroy();
		});

		pingRequest.write('');
		pingRequest.end();
	});

	return promise;
}

/**
 * Waits for a url to be pingable.
 *
 * @param url The url to ping.
 * @param interval The interval to wait between pings.
 * @param max The maximum amount of time to wait.
 *
 * @returns Url ping result promise.
 */
export async function waitFor(url: string, interval = 200, max = 30_000) {
	let time = Math.ceil(max / interval);
	while (time > 0) {
		time -= 1;
		if (await ping(url)) {
			return true;
		}
		await timeout(interval);
	}

	return false;
}

/**
 * Checks if the authority part of a URL is a host name
 * rather than an IP address.
 *
 * @param hostname The host part of a URL.
 *
 * @returns True if it's not an IP address, false if it is
 */
export function isHostname(hostname: string) {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return !ipv4Pattern.test(hostname) && 
		!ipv6Pattern.test(hostname);
}