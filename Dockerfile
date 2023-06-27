from node:16

workdir /app
run git clone https://github.com/evidence-dev/evidence.git .
run git fetch
run git checkout feat/multi-sources
run git status
run npm i -g pnpm@7.30.5
run pnpm install --frozen-lockfile
