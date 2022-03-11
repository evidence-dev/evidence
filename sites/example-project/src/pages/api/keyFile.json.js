import fs from 'fs';

// Test endpoint for uploading and saving JSON keyfile for BQ credentials
// if saved to file system, we should include in the UI some feedback for the
// user so they know their file is stored

export function post(request) {
    const formBody = JSON.parse(request.body)
    console.log(formBody)
    // const files = formBody.files

    // fs.writeFileSync('.evidence/'+files.name, files);

    return {
        body: "settings saved"
    }
}
