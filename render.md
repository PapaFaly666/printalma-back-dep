pfdev@PC:/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep$ npm run start

> printalma-back@0.0.1 start
> node --max-old-space-size=512 dist/src/main.js

node:internal/modules/cjs/loader:1251
  throw err;
  ^

Error: Cannot find module 'multerConfig'
Require stack:
- /mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/dist/src/product/product.controller.js
- /mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/dist/src/product/product.module.js 
- /mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/dist/src/app.module.js
- /mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/dist/src/main.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1248:15)
    at Module._load (node:internal/modules/cjs/loader:1074:27)
    at TracingChannel.traceSync (node:diagnostics_channel:315:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:217:24)
    at Module.require (node:internal/modules/cjs/loader:1339:12)
    at require (node:internal/modules/helpers:125:16)
    at Object.<anonymous> (/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/dist/src/product/product.controller.js:25:24)
    at Module._compile (node:internal/modules/cjs/loader:1546:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1691:10)
    at Module.load (node:internal/modules/cjs/loader:1317:32) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/dist/src/product/product.controller.js',
    '/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/dist/src/product/product.module.js',
    '/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/dist/src/app.module.js',        
    '/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/dist/src/main.js'
  ]
}

Node.js v22.6.0
pfdev@PC:/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep$