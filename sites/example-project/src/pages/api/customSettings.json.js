import fs from 'fs';
import path from 'path';

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

export function post(request) {
    const { newCustomFormat } = JSON.parse(request.body);

    let customSettings = getCustomSettings() || {};

    if (newCustomFormat) {
        if (!customSettings.customFormats) {
            customSettings.customFormats = [];
        }
        if (newCustomFormat.formatTag && newCustomFormat.formatCode) {
            customSettings.customFormats.push(newCustomFormat);
        }
        saveCustomSettings(customSettings);
    }
    return {  body: customSettings };
}

export function del(request) {
    const { formatTag } = JSON.parse(request.body);
    let customSettings = getCustomSettings() || {};
    if (formatTag) {
        if (!customSettings.customFormats) {
            customSettings.customFormats = [];
        }
        let index = customSettings.customFormats.findIndex(format => format.formatTag === formatTag);
        if (index >= 0) {
            customSettings.customFormats.splice(index, 1);
        }
        saveCustomSettings(customSettings);
    }
    return {  body: customSettings };
}