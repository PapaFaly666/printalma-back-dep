==> Cloning from https://github.com/PapaFaly666/printalma-back-dep
==> Checking out commit eb88a371e494e2dd7bcc5e69fc5cc3f94496f49a in branch main
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install; npm run build'...
added 1041 packages, and audited 1042 packages in 14s
174 packages are looking for funding
  run `npm fund` for details
46 vulnerabilities (9 low, 36 high, 1 critical)
To address issues that do not require attention, run:
  npm audit fix
To address all issues (including breaking changes), run:
  npm audit fix --force
Run `npm audit` for details.
> printalma-back@0.0.1 build
> prisma generate
Prisma schema loaded from prisma/schema.prisma
✔ Generated Prisma Client (v6.7.0) to ./node_modules/.prisma/client in 255ms
Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
Tip: Easily identify and fix slow SQL queries in your app. Optimize helps you enhance your visibility: https://pris.ly/--optimize
==> Uploading build...
==> Uploaded in 9.1s. Compression took 4.4s
==> Build successful 🎉
==> Deploying...
==> Running 'npm run start'
> printalma-back@0.0.1 start
> NODE_OPTIONS='--max-old-space-size=512' npx ts-node --transpile-only --files src/main.ts
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'npm run start'
> printalma-back@0.0.1 start
> NODE_OPTIONS='--max-old-space-size=512' npx ts-node --transpile-only --files src/main.ts
Error: Cannot find module 'prisma.service'
Require stack:
- /opt/render/project/src/src/app.controller.ts
- /opt/render/project/src/src/app.module.ts
- /opt/render/project/src/src/main.ts
    at Function.<anonymous> (node:internal/modules/cjs/loader:1401:15)
    at Function.Module._resolveFilename.sharedData.moduleResolveFilenameHook.installedValue [as _resolveFilename] (/opt/render/project/src/node_modules/@cspotcode/source-map-support/source-map-support.js:811:30)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1057:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1062:22)
    at Function._load (node:internal/modules/cjs/loader:1211:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/src/app.controller.ts:3:1) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/src/app.controller.ts',
    '/opt/render/project/src/src/app.module.ts',
    '/opt/render/project/src/src/main.ts'
  ]
}