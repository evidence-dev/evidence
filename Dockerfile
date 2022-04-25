## Docker image usage:
## 1. Map the project folder to `/evidence/project`.
## 2. Available commands for the docker iamge are:
##    - 'init': copy the template to your project folder.
##    - 'demo' to run Evidence with the default init project.
##    - 'dev' to run the default 'dev' interface on the default port.
##    - 'bash' to open an interactive terminal on the container.
##
## Note: For new projects, the default `package.json` file will be overriden
## by a custom project which already has `--host 3000`, which allows access
## to the web host on port 3000.

FROM node:18.0

RUN npm install -g degit

RUN apt-get update && \
    apt-get install nano

WORKDIR /evidence
RUN npx degit evidence-dev/template new-project
RUN mkdir -p /evidence && \
    mkdir -p /evidence/project
WORKDIR /evidence/new-project
RUN npm install -y

WORKDIR /evidence

COPY . /evidence/
COPY ./docker/example-project-overrides/package.json /evidence/new-project/package.json

WORKDIR /evidence/project

ENTRYPOINT [ "bash", "/evidence/docker/bootstrap.sh" ]
