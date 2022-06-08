import fs from 'fs';
import path from 'path';
import { dev } from '$app/env';

export async function get() {
	if (!dev) {
		return {
			status: 404
		};
	} else {
		let project = {name: "Evidence"};
		if (fs.existsSync('evidence.project.json')) {
			project = JSON.parse(fs.readFileSync('evidence.project.json', 'utf8'));
		}
		return {
			header: 'accept: application/json',
			status: 200,
			body: project
		};
	}
}

export function post(request) {
	const project = JSON.parse(request.body);
	fs.writeFileSync('evidence.project.json', JSON.stringify(project));
	return {
		body: project
	};
}