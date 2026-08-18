# Evidence

Evidence is an agent-ready tool for creating reports using your data
- Fully defined in code
- Human + agent readable markdown format with inline SQL
- Self host or deploy on Evidence Studio

## Install

### macOS / Linux

```bash
curl -fsSL https://evidence.studio/install.sh | sh
evidence help
```

### Windows

```powershell
irm https://evidence.studio/install.ps1 | iex
evidence help
```

## Create a New Project

```bash
evidence init my-project
cd my-project
evidence dev
```


## Build from Source

Requires [Node](https://nodejs.org) 22.22+, [pnpm](https://pnpm.io) and [bun](https://bun.com).

```bash
pnpm install
pnpm run cli:build
```

The binary is written to `cli/dist/evidence`.

## Contributing

Contributions are welcome.

This project is a mirror - see [CONTRIBUTING.md](CONTRIBUTING.md) for how
pull requests are reviewed and merged.


