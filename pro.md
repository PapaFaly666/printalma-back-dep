pfdev@PC:/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep$ npm run start

> printalma-back@0.0.1 start
> cross-env TS_NODE_TRANSPILE_ONLY=true node --max-old-space-size=512 -r ts-node/register src/main.ts

/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/node_modules/src/decorator/typechecker/IsEnum.ts:18
  return Object.entries(entity)
                ^
TypeError: Cannot convert undefined or null to object
    at Function.entries (<anonymous>)
    at validEnumValues (/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/node_modules/src/decorator/typechecker/IsEnum.ts:18:17)
    at IsEnum (/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/node_modules/src/decorator/typechecker/IsEnum.ts:30:29)
    at Object.<anonymous> (/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/design/dto/query-design.dto.ts:33:10)
    at Module._compile (node:internal/modules/cjs/loader:1546:14)
    at Module.m._compile (/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/node_modules/ts-node/src/index.ts:1618:23)
    at Module._extensions..js (node:internal/modules/cjs/loader:1691:10)
    at Object.require.extensions.<computed> [as .ts] (/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1317:32)
    at Function.Module._load (node:internal/modules/cjs/loader:1127:12)
pfdev@PC:/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep$