import fs from 'fs';
import path from 'path';
import { dev } from '$app/env';

const CUSTOM_SETTINGS_FILE = '.custom-settings.json';

function getCustomSettings() {
    let customSettingsPath = path.join(path.resolve('./'), CUSTOM_SETTINGS_FILE);
    if (fs.existsSync(customSettingsPath)) {
        return JSON.parse(fs.readFileSync(customSettingsPath, 'utf8'));
    }
}

function saveCustomSettings(customSettings) {
    let customSettingsPath = path.join(path.resolve('./'), CUSTOM_SETTINGS_FILE);
    fs.writeFileSync(customSettingsPath, JSON.stringify(customSettings, null, 2));
}

export async function get() {
    if (!dev) {
        return {
            status: 404
        }
    } else { 
        let customSettings = {};
        try{
            customSettings = getCustomSettings() || customSettings;
        } catch {
            // custom settings will be empty for now.
        }
        let result = { customSettings };
        return {
            header: "accept: application/json",
            status: 200,
            body: result
        }
    }
}

export function post(request) {
    let body = JSON.parse(request.body);
    const { newCustomFormat } = JSON.parse(request.body);

    let customSettings = getCustomSettings() || {};

    if (newCustomFormat) {
        if (!customSettings.customFormats) {
            customSettings.customFormats = [];
        }
        if (newCustomFormat.formatName && newCustomFormat.formatValue) {
            customSettings.customFormats.push(newCustomFormat);
        }
        saveCustomSettings(customSettings);
    }
    return {  body: customSettings };

}