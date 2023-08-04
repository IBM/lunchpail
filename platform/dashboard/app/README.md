# Dashboard

<img width="997" alt="image" src="https://media.github.ibm.com/user/270346/files/402d3b74-0f75-4716-a40c-dabb14bc3ae1">

## Getting Started

Using the [React Starter Kit](https://github.com/kriasoft/react-starter-kit), we can see the dashboard via `http://localhost:5173/` (press `q` key to exit).


In a terminal, 
```
cd platform/dashboard/app 
yarn install
yarn start
```


## Directory Structure

- The Dashboard itself can be found in `platform/dashboard/app/routes/dashboard/Dashboard.tsx`
- The remaining components are located in the `platform/dashboard/app/eda/` directory. 
- The top level browser router is in index.tsx found at `platform/dashboard/app/routes/index.tsx`


`├──`[`common`](./common) — Common (shared) React components<br>
`├──`[`eda`](./eda) — EDA related components<br>
`├──`[`layout`](./layout) — Layout related components<br>
`├──`[`routes`](./routes) — Application routes and page (screen) components<br>
`|  ├──`[`dashboard`](./app/routes/dashboard)<br>
`|  |   ├──`[`Dashboard.tsx`](./app/routes/dashboard/Dashboard.tsx) — front-end built with [React](https://react.dev/) and [Material UI](https://mui.com/core/)<br>
`├──`[`global.d.ts`](./global.d.ts) — Global TypeScript declarations<br>
`├──`[`index.html`](./index.html) — HTML page containing application entry point (top level router)<br>
`├──`[`index.tsx`](./index.tsx) — Single-page application (SPA) entry point<br>
`├──`[`package.json`](./package.json) — Workspace settings and NPM dependencies<br>
`├──`[`tsconfig.ts`](./tsconfig.json) — TypeScript configuration<br>
`└──`[`vite.config.ts`](./vite.config.ts) — JavaScript bundler configuration ([docs](https://vitejs.dev/config/))<br>

## Scripts

- `yarn start` — Launches the app in development mode on [`http://localhost:5173/`](http://localhost:5173/)
- `yarn build` — Compiles and bundles the app for deployment
- `yarn lint` — Validate the code using ESLint
- `yarn tsc` — Validate the code using TypeScript compiler
- `yarn test` — Run unit tests with Vitest, Supertest
- `yarn edge deploy` — Deploys the app to Cloudflare

## How to Update

- `yarn install` — Update dependencies
- `yarn set version latest` — Bump Yarn to the latest version
- `yarn upgrade-interactive` — Update Node.js modules (dependencies)
- `yarn dlx @yarnpkg/sdks vscode` — Update TypeScript, ESLint, and Prettier settings in VSCodes