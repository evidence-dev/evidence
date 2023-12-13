---
sidebar_position: 1
title: CLI Reference
hide_title: false
hide_table_of_contents: false
---

## Commands

| CLI Command                                     | VS Code Command                   | Description                                            |
| ----------------------                          | ---------------                   | ------------------------------------------------------ |
| `npx degit evidence-dev/template my-project`    | Evidence: New Evidence Project    | Create a new project from the template.                |
| `npm run sources`                               | Evidence: Run Sources             | Extract data from sources.                             |
| `npm run dev`                                   | Evidence: Start Server            | Start the development server in the current directory. |
| `npm run build`                                 | Evidence: Build                   | Build the project for production.                      |
| `npm run build:strict`                          | Evidence: Built Strict            | Build, but fails on query or component errors. [Components receiving empty data will fail.](/deployment/overview#buildstrict) |
| `Ctrl / Cmd` + `C`                              | Evidence: Stop Server             | Stop the dev server (when running).                    |
| `r`                                             | N/A                               | Restart the dev server (when running).                 |

## Options

Append flags with an extra `--` after the command to modify behavior.

For example, `npm run dev -- --port 4000` will start the development server on port 4000.

Some of the most common are:

| Command   | Flag                        | Description                                  | Detail                                                    |
| --------  | ---------------             | -------------------------------------------- | ----------------------------------------------------      |
| `sources` | `--changed`                 | Only run sources whose queries have changed  |                                                           |
| `sources` | `--sources [source_name]`   | Only run sources from the specified sources  | Seperate with commas `--sources source1,source2`          |
| `sources` | `--queries [query_name]`    | Only run the specified queries               | Seperate with commas                                      |
| `sources` | `--debug`                   | Show debug output                            |                                                           |
| `dev`     | `--open [path]`             | Open browser to `path` on startup (`string`) | Default `--open /` opens in root of the project           |
| `dev`     | `--host [host]`             | Specify hostname (`string`)                  | `--host 0.0.0.0` can be helpful in containers             |
| `dev`     | `--port <port>`             | Specify port (`number`)                      | Automatically increment if default `3000` is in use       |

Evidence's `dev` server runs on Vite, and so supports [Vite's options](https://vitejs.dev/guide/cli.html#options).

## Environment Variables

You can set environment variables to configure Evidence in production. Most of these are used to set database credentials securely.

The format of environment variables for database credentials is `EVIDENCE_SOURCE__[SOURCE_NAME]__[VARIABLE_NAME]`.

You can copy all your current environment variable values from the settings page at [localhost:3000/settings](http://localhost:3000/settings).