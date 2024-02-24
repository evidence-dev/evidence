import http from 'http';
import httpProxy from 'http-proxy';
import fs from 'fs';
import path from 'path';
import open from 'open';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let appIsReady = false;

// Function to start the proxy server
export function startProxyServer(proxyPort, appPort) {
  const loadingPagePath = path.join(__dirname, 'static', 'loading.html');

  fs.readFile(loadingPagePath, 'utf8', (err, data) => {
      if (err) {
          console.error('Failed to read loading page:', err);
          return;
      }

      const proxy = httpProxy.createProxyServer({});
      const server = http.createServer((req, res) => {
          if (req.url === '/') {
              // For the root path, serve the customized loading page
              // Customize the loading page with the appPort
              const customizedLoadingPage = data.replace(/{{PORT}}/g, appPort);
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(customizedLoadingPage);
          } else if(appIsReady){
              // For all other requests, forward them to the SvelteKit app
              proxy.web(req, res, { target: `http://localhost:${appPort}` });
          }
      });

      server.listen(proxyPort, () => {
          // console.log(`Proxy server listening on http://localhost:${proxyPort}`);
          // Automatically open the browser pointing to the proxy server
          open(`http://localhost:${proxyPort}`);
      });

      // Handle WebSocket upgrades for HMR
      server.on('upgrade', (req, socket, head) => {
          proxy.ws(req, socket, head, { target: `http://localhost:${appPort}` });
      });
  });
}

export function checkAppReady(appPort, callback) {
  if (appIsReady) {
    return true; // Stop polling if the app is already marked as ready
  }

  fetch(`http://localhost:${appPort}`)
    .then(response => {
      if (response.ok) {
        // console.log('SvelteKit app is ready.');
        appIsReady = true; // Mark the app as ready to stop further polling
        callback(appPort); // Execute the callback to signal readiness
        return true;
      } else {
        // console.log('App not ready yet, retrying...');
        setTimeout(() => checkAppReady(appPort, callback), 100); // Retry after a delay
        return false;
      }
    })
    .catch(error => {
      // console.log('App not ready yet, retrying...');
      // console.error('Error checking app readiness:', error);
      setTimeout(() => checkAppReady(appPort, callback), 100); // Retry after a delay
      return false;
    });
}