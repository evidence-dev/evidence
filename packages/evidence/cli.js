#!/usr/bin/env node

import fs from 'fs-extra'
import { spawn } from 'child_process';
import * as chokidar from 'chokidar'
import path from 'path';
import {fileURLToPath} from 'url';
import sade from 'sade';

const populateTemplate = function() {
    // Create the template project in .evidence/template
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    fs.ensureDirSync("./.evidence/template/")

    // empty the template directory, except any local settings, or telemetry profile that already exist. 
    fs.readdirSync("./.evidence/template/").forEach(file => {
      if(file != "evidence.settings.json" && file != ".profile.json")
        fs.removeSync(path.join("./.evidence/template/", file))
      }
    )

    fs.copySync(path.join(__dirname, '/template'), "./.evidence/template/")

    // package.json is awkward to have in the monorepo, but vite needs it to find the root of the project 
    const packageContents = {type: "module"}
    fs.writeJsonSync("./.evidence/template/package.json", packageContents)
}

const clearQueryCache = function() {
  fs.removeSync(".evidence/template/.evidence-queries/cache")
  console.log("Cleared query cache")
}

const runFileWatcher = function(watchPatterns) {

  const ignoredFiles = [
    "./pages/settings/**", 
    "./pages/settings.+(*)",
    "./pages/api/**", 
    "./pages/api.+(*)"
  ]

  var watchers = []

  watchPatterns.forEach((pattern,item) => {
    watchers[item] = chokidar.watch(path.join(pattern.sourceRelative, pattern.filePattern), { ignored: ignoredFiles});

    const sourcePath = p => path.join('./', p)
    const targetPath = p => path.join(pattern.targetRelative, path.relative(pattern.sourceRelative, p))

    watchers[item]
        .on('add', path => fs.copyFileSync(sourcePath(path), targetPath(path)))
        .on('change', path => fs.copyFileSync(sourcePath(path), targetPath(path)))
        .on('unlink', path => fs.rmSync(targetPath(path)))
        .on('addDir', path => {
          if(!fs.existsSync(targetPath(path))){
            fs.mkdirSync(targetPath(path))}
          })
        .on('unlinkDir', path => fs.rmdirSync(targetPath(path)));
  })
  return watchers 
}

const flattenArguments = function(args) {
  if (args) {
    const result = [];
    const keys = Object.keys(args);
    keys.forEach(key => {
      if (key !== '_') {
        result.push(`--${key}`);
        if (args[key]) {
          result.push(args[key]);
        }
      }
    });
    return result;
  } else {
    return [];
  }
}

const watchPatterns = 
    [
      {'sourceRelative': './pages/','targetRelative':'./.evidence/template/src/pages/','filePattern':'**'} // markdown pages
      ,{'sourceRelative': './static/','targetRelative':'./.evidence/template/static/','filePattern':'**'} // static files (eg images)
      ,{'sourceRelative': './sources/','targetRelative':'./.evidence/template/sources/','filePattern':'**'} // source files (eg csv files)
      ,{'sourceRelative': './components/','targetRelative':'./.evidence/template/src/components/','filePattern':'**'} // custom components
      ,{'sourceRelative': '.','targetRelative':'./.evidence/template/src/','filePattern':'app.css'} // custom theme file
    ]

    const buildHelper = function(command, args){
      const watchers = runFileWatcher(watchPatterns)
      const flatArgs = flattenArguments(args);
      // Run svelte kit build in the hidden directory 
      const child = spawn(command, flatArgs, {
        shell: true, 
        cwd:'.evidence/template', 
        stdio: "inherit",
      });
      // Copy the outputs to the root of the project upon successful exit 
      child.on('exit', function (code) {
        if(code === 0) {
          fs.copySync('./.evidence/template/build', './build')
          console.log("Build complete --> /build ")
        } else {
          console.error("Build failed")
        }
        child.kill();
        watchers.forEach(watcher => watcher.close())
        if (code !== 0) {
          throw `Build process exited with code ${code}`;
        }
      })
    }
  
const prog = sade('evidence')

prog
  .command('dev')
  .describe("launch the local evidence development environment")
  .action((args) => {
    populateTemplate()
    const watchers = runFileWatcher(watchPatterns)
    const flatArgs = flattenArguments(args);

    // Run svelte kit dev in the hidden directory 
    const child = spawn('npx svelte-kit dev', flatArgs, {
      shell: true, 
      detached: false, 
      cwd:'.evidence/template', 
      stdio: "inherit"
    });

    child.on('exit', function () {
      child.kill()
      watchers.forEach(watcher => watcher.close())
    })

  }); 

prog
  .command('build')
  .describe("build production outputs")
  .action((args) => {
    populateTemplate()
    clearQueryCache()
    buildHelper("npx svelte-kit build", args)

  });

  prog
  .command('build:strict')
  .describe("build production outputs and fails on error")
  .action((args) => {
    populateTemplate()
    clearQueryCache()
    buildHelper('VITE_BUILD_STRICT=true npx svelte-kit build', args)
  }); 


  prog.parse(process.argv)