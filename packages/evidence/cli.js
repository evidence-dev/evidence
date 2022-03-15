#!/usr/bin/env node

import fs from 'fs-extra'
import { spawn } from 'child_process';
import * as chokidar from 'chokidar'
import path from 'path';
import {fileURLToPath} from 'url';
import sade from 'sade';

const populateDevTemplate = function() {
    // Create the template project in .evidence/dev 
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    fs.emptyDirSync("./.evidence/dev/")
    fs.copySync(path.join(__dirname, '/template'), "./.evidence/dev/")

    // package.json is awkward to have in the monorepo, but vite needs it to find the root of the project 
    const packageContents = {type: "module"}
    fs.writeJsonSync("./.evidence/dev/package.json", packageContents)
}

const prog = sade('evidence')

prog
  .command('dev')
  .describe("launch the local evidence development environment")
  .action(() => {
    populateDevTemplate()

    // Watcher and syncing   
    const ignoredFiles = [
      "./pages/settings/**", 
      "./pages/settings.+(*)",
      "./pages/api/**", 
      "./pages/api.+(*)"
    ]

    const watcher = chokidar.watch('./pages/**', {ignored:ignoredFiles})

    const sourcePath = path => "./"+path
    const targetPath = path => "./.evidence/dev/src/pages/"+path.split("pages/")[1]
    watcher
        .on('add', path => fs.copyFileSync(sourcePath(path), targetPath(path)))
        .on('change', path => fs.copyFileSync(sourcePath(path), targetPath(path)))
        .on('unlink', path => fs.rmSync(targetPath(path)))
        .on('addDir', path => {
          if(!fs.existsSync(targetPath(path))){
            fs.mkdirSync(targetPath(path))}
          })
        .on('unlinkDir', path => fs.rmdirSync(targetPath(path)))
    ;

    // Run svelte kit dev in the hidden directory 
    // TODO: Improve the Handling of feedback / console logging from svelte & evidence
    const child = spawn('npx svelte-kit dev -- --open', {shell: true, cwd:'.evidence/dev'});

    child.stdout.on('data', (data) => {
      console.log(`child stdout:\n${data}`);
    });
    child.stderr.on('data', (data) => {
      console.error(`child stderr:\n${data}`);
    });
    child.on('exit', function (code, signal) {
      console.log('Child process exited with ' +
                  `code ${code} and signal ${signal}`);
    });

  }); 

  prog.parse(process.argv)