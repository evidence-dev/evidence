import express from 'express';
import { getManifest } from './virtuals/node/static-assets.js';
import fs from 'fs/promises';
import path from 'path';
import { dataDirectory } from '../../lib/projectPaths.js';

/**
 * Creates an express application that handles Evidence-specific functionality
 * e.g. Fetching parquet files,
 *
 * @returns {import("vite").Connect.HandleFunction}
 */
export const getSidecarApp = () => {
	const app = express();

	// Handle custom URLs
	app.get('/_evidence/manifest.json', (req, res) => {
		res.send(getManifest('browser')).end();
	});

	app.get('/_evidence/:route_hash/:additional_hash/all-queries.json', (req, res) => {
		res
			.send(
				JSON.stringify({
					params: req.params
				})
			)
			.end();
	});
	app.get('/_evidence/prerendered-queries/:query_hash.arrow', (req, res) => {
		return res.send('Arrow file here!').end();
	});
	app.get('/_evidence/query/:schema/:filename.parquet', async (req, res) => {
		// TODO: Check if the file really exists
		const filepath = path.join(
			dataDirectory,
			req.params.schema,
			req.params.filename,
			req.params.filename + '.parquet'
		);

		if (
			await fs
				.stat(filepath)
				.then(() => true)
				.catch(() => false)
		) {
			res.sendFile(filepath, {
				acceptRanges: true /* Important to allow predicate pushdown */
			});
		} else {
			res.sendStatus(404);
		}
	});

	app.get('/_evidence/*', (req, res) => res.sendStatus(404).end());
	app.post('/_evidence/*', (req, res) => res.sendStatus(405).end());
	app.patch('/_evidence/*', (req, res) => res.sendStatus(405).end());
	app.put('/_evidence/*', (req, res) => res.sendStatus(405).end());
	app.delete('/_evidence/*', (req, res) => res.sendStatus(405).end());

	return app;
};

/**
 *
 * @param {import("vite").UserConfig} cfg
 */
export const applySidecarConfig = (cfg) => {
	if (!cfg.server) cfg.server = {};
	if (!cfg.server.proxy) cfg.server.proxy = {};
	cfg.server.proxy['/_evidence'] = {};

	if (!cfg.preview) cfg.preview = {};
	if (!cfg.preview.proxy) cfg.preview.proxy = {};
	cfg.preview.proxy['/_evidence'] = {};

	return cfg;
};
