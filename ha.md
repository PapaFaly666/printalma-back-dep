pfdev@PC:/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep$ npm run start

> printalma-back@0.0.1 start
> cross-env TS_NODE_TRANSPILE_ONLY=true node --max-old-space-size=512 -r ts-node/register src/main.ts

/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/vendor-product/admin-wizard-validation.controller.ts:332
  async validateIndividualProduct(
        ^
ReferenceError: Post is not defined
    at Object.<anonymous> (/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/vendor-product/admin-wizard-validation.controller.ts:332:9)
    at Module._compile (node:internal/modules/cjs/loader:1546:14)
    at Module.m._compile (/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/node_modules/ts-node/src/index.ts:1618:23)
    at Module._extensions..js (node:internal/modules/cjs/loader:1691:10)
    at Object.require.extensions.<computed> [as .ts] (/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1317:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1127:12)
    at TracingChannel.traceSync (node:diagnostics_channel:315:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:217:24)
    at Module.require (node:internal/modules/cjs/loader:1339:12)