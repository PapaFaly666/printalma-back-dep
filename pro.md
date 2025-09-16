pfdev@PC:/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep$ npm run start

> printalma-back@0.0.1 start
> cross-env TS_NODE_TRANSPILE_ONLY=true node --max-old-space-size=512 -r ts-node/register src/main.ts

Error: Cannot find module '.prisma/client/default'
Require stack:
- /mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/node_modules/@prisma/client/default.js
- /mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/prisma.service.ts
- /mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/app.controller.ts
- /mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/app.module.ts
- /mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/main.ts
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:1248:15)
    at Function.Module._resolveFilename.sharedData.moduleResolveFilenameHook.installedValue [as _resolveFilename] (/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/node_modules/@cspotcode/source-map-support/source-map-support.js:811:30)
    at Function.Module._load (node:internal/modules/cjs/loader:1074:27)
    at TracingChannel.traceSync (node:diagnostics_channel:315:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:217:24)
    at Module.require (node:internal/modules/cjs/loader:1339:12)
    at require (node:internal/modules/helpers:125:16)
    at Object.<anonymous> (/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/node_modules/@prisma/client/default.js:2:6)
    at Module._compile (node:internal/modules/cjs/loader:1546:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1691:10) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/node_modules/@prisma/client/default.js',
    '/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/prisma.service.ts',
    '/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/app.controller.ts',
    '/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/app.module.ts',
    '/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/main.ts'
  ]
}
pfdev@PC:/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep$