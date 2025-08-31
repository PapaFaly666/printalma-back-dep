==> Cloning from https://github.com/PapaFaly666/printalma-back-dep
==> Checking out commit 49563014b7abdc9cb2a58a03de22dbc41c6fd643 in branch main
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install; npm run build'...
added 1041 packages, and audited 1042 packages in 13s
174 packages are looking for funding
  run `npm fund` for details
46 vulnerabilities (9 low, 36 high, 1 critical)
To address issues that do not require attention, run:
  npm audit fix
To address all issues (including breaking changes), run:
  npm audit fix --force
Run `npm audit` for details.
> printalma-back@0.0.1 build
> prisma generate && nest build
Prisma schema loaded from prisma/schema.prisma
Error: 
Generating client into /opt/render/project/src/node_modules/@prisma/client is not allowed.
This package is used by `prisma generate` and overwriting its content is dangerous.
Suggestion:
In /opt/render/project/src/prisma/schema.prisma replace:
4 output        = "../node_modules/@prisma/client"
with
4 output        = "../node_modules/.prisma/client"
You won't need to change your imports.
Imports from `@prisma/client` will be automatically forwarded to `.prisma/client`
==> Build failed 😞
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys