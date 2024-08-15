clear
echo "Force rebuilding Evidence monorepo"
rm -rf node_modules pnpm-lock.yaml ./**/dist
pnpm i
pnpm run --if-present -r --filter "./packages/**/*" package
pnpm run --if-present -r --filter "./packages/**/*" --filter "./packages/evidence" --filter "!./packages/evidence/template" build
pnpm run format
pnpm run lint