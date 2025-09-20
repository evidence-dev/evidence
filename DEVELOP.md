# Development Setup with Local Evidence Packages

This guide explains how to set up an Evidence project to use local Evidence packages for development, allowing you to edit Evidence source code and see changes immediately.

## Prerequisites

- An existing Evidence project
- Local clone of the Evidence repository
- Node.js and npm installed

## Step 1: Clone Evidence Repository

```bash
git clone https://github.com/evidence-dev/evidence.git
cd evidence
git checkout release-2025-02-20  # Use stable release branch
npm install
npm run build
```

## Step 2: Configure Your Evidence Project

In your Evidence project's `package.json`, replace Evidence package references with local file paths:

```json
{
  "dependencies": {
    "@evidence-dev/core-components": "file:../evidence/packages/ui/core-components",
    "@evidence-dev/component-utilities": "file:../evidence/packages/lib/component-utilities",
    "@evidence-dev/sdk": "file:../evidence/packages/lib/sdk",
    "@evidence-dev/db-commons": "file:../evidence/packages/lib/db-commons",
    "@evidence-dev/universal-sql": "file:../evidence/packages/lib/universal-sql",
    "@evidence-dev/tailwind": "file:../evidence/packages/ui/tailwind"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "3.0.1",
    "@sveltejs/kit": "2.8.4",
    "@sveltejs/vite-plugin-svelte": "3.1.2",
    "@tailwindcss/vite": "^4.0.0",
    "svelte": "4.2.19",
    "vite": "5.4.14"
  }
}
```

**Important**: Use exact versions to match Evidence's dependencies, especially Svelte 4.2.19.

## Step 3: Fix Tailwind CSS Content Scanning

When using local packages, Tailwind CSS v4 cannot find Evidence component files. You need to update the Evidence Tailwind configuration:

Edit `/path/to/evidence/packages/ui/tailwind/src/config/config.js`:

```javascript
export const config = {
  content: [
    // Core Evidence components source files (for local development)
    '../../../core-components/src/**/*.{html,js,svelte,ts,md}',
    './node_modules/@evidence-dev/core-components/src/**/*.{html,js,svelte,ts,md}',
    './node_modules/@evidence-dev/core-components/dist/**/*.{html,js,svelte,ts,md}',

    // Additional Evidence UI packages
    '../../../*/src/**/*.{html,js,svelte,ts,md}',
    './node_modules/@evidence-dev/*/src/**/*.{html,js,svelte,ts,md}',
    './node_modules/@evidence-dev/*/dist/**/*.{html,js,svelte,ts,md}',

    // Consumer project files
    './src/**/*.{html,js,svelte,ts,md}',
    './.evidence/template/src/**/*.{html,js,svelte,ts,md}'
  ],
  // ... rest of existing config
}
```

## Step 4: Update Vite Configuration

In your project's `vite.config.js`, exclude core-components from optimization:

```javascript
export default {
  // ... other config
  optimizeDeps: {
    exclude: [
      'svelte-icons',
      '@evidence-dev/universal-sql',
      '$evidence/config',
      '$evidence/themes',
      '@evidence-dev/core-components'  // Add this line
    ]
  }
}
```

## Step 5: Install Dependencies and Run

```bash
# Install with force to handle local package linking
npm install --force

# Start development server
npm run dev
```

## Why This Setup is Needed

### Svelte Version Compatibility
Evidence is built with Svelte 4.2.19, but newer projects might default to Svelte 5. Version mismatches cause compilation errors.

### Tailwind CSS Content Scanning
Tailwind CSS v4 scans files to determine which utility classes to generate. When using local packages instead of published npm packages, the file paths change and Tailwind cannot find Evidence component files, resulting in missing CSS rules and broken styling.

### Vite Dependency Optimization
Vite pre-bundles dependencies for faster loading. Local packages need different handling than published packages, so core-components should be excluded from optimization.

## Troubleshooting

### Styling Issues (Oversized Icons, Missing CSS)
This typically indicates Tailwind isn't finding Evidence component files. Verify:
1. The Tailwind config includes the correct content paths
2. The Evidence repository is built (`npm run build` in Evidence repo)
3. File paths in `package.json` are correct relative to your project

### Build Errors
Check that:
1. Svelte versions match exactly (4.2.19)
2. SvelteKit version is compatible (2.8.4)
3. All local package paths exist and are built

### Force Reinstall
If packages seem corrupted:
```bash
rm -rf node_modules package-lock.json
npm install --force
```

## Development Workflow

1. Make changes to Evidence source code
2. Build Evidence packages: `cd evidence && npm run postinstall`e
3. Changes should automatically reflect in your project (HMR)
4. For major changes, restart your dev server

This setup allows you to develop Evidence components locally while maintaining a working project environment.