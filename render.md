==> Cloning from https://github.com/PapaFaly666/printalma-back-dep
==> Checking out commit 49d4c255807c84f5da8339ca522de6e1f831062e in branch main
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install; npm run build'...
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error
npm error While resolving: @nestjs/websockets@10.0.0
npm error Found: reflect-metadata@0.2.2
npm error node_modules/reflect-metadata
npm error   reflect-metadata@"^0.2.0" from the root project
npm error   peer reflect-metadata@"^0.1.12 || ^0.2.0" from @nestjs/common@10.4.17
npm error   node_modules/@nestjs/common
npm error     @nestjs/common@"^10.0.0" from the root project
npm error     peer @nestjs/common@">=7.0.9" from @nestjs-modules/mailer@2.0.2
npm error     node_modules/@nestjs-modules/mailer
npm error       @nestjs-modules/mailer@"^2.0.2" from the root project
npm error     11 more (@nestjs/config, @nestjs/core, @nestjs/jwt, ...)
npm error   3 more (@nestjs/core, @nestjs/mapped-types, @nestjs/swagger)
npm error
npm error Could not resolve dependency:
npm error peer reflect-metadata@"^0.1.12" from @nestjs/websockets@10.0.0
npm error node_modules/@nestjs/websockets
npm error   @nestjs/websockets@"^10.0.0" from the root project
npm error   peerOptional @nestjs/websockets@"^10.0.0" from @nestjs/core@10.4.17
npm error   node_modules/@nestjs/core
npm error     @nestjs/core@"^10.0.0" from the root project
npm error     6 more (@nestjs-modules/mailer, @nestjs/platform-express, ...)
npm error   1 more (@nestjs/platform-socket.io)
npm error
npm error Conflicting peer dependency: reflect-metadata@0.1.14
npm error node_modules/reflect-metadata
npm error   peer reflect-metadata@"^0.1.12" from @nestjs/websockets@10.0.0
npm error   node_modules/@nestjs/websockets
npm error     @nestjs/websockets@"^10.0.0" from the root project
npm error     peerOptional @nestjs/websockets@"^10.0.0" from @nestjs/core@10.4.17
npm error     node_modules/@nestjs/core
npm error       @nestjs/core@"^10.0.0" from the root project
npm error       6 more (@nestjs-modules/mailer, @nestjs/platform-express, ...)
npm error     1 more (@nestjs/platform-socket.io)
npm error
npm error Fix the upstream dependency conflict, or retry
npm error this command with --force or --legacy-peer-deps
npm error to accept an incorrect (and potentially broken) dependency resolution.
npm error
npm error
npm error For a full report see:
npm error /opt/render/.cache/_logs/2025-08-31T22_52_31_632Z-eresolve-report.txt
npm error A complete log of this run can be found in: /opt/render/.cache/_logs/2025-08-31T22_52_31_632Z-debug-0.log
> printalma-back@0.0.1 build
> prisma generate && nest build
sh: 1: prisma: not found
==> Build failed 😞
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys