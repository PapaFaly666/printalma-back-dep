==> Cloning from https://github.com/PapaFaly666/printalma-back-dep
==> Checking out commit 8e8d12c39b44dab368b2010624e08333ac980b50 in branch main
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install; npm run build'...
added 1041 packages, and audited 1042 packages in 25s
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
✔ Generated Prisma Client (v6.7.0) to ./node_modules/.prisma/client in 506ms
Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
Tip: Want real-time updates to your database without manual polling? Discover how with Pulse: https://pris.ly/tip-0-pulse
==> Uploading build...
==> Uploaded in 7.1s. Compression took 5.4s
==> Build successful 🎉
==> Deploying...
==> Running 'npm run start'
> printalma-back@0.0.1 start
> nest start
==> No open ports detected, continuing to scan...
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
<--- Last few GCs --->
[80:0xea38000]    48689 ms: Mark-Compact (reduce) 252.4 (257.6) -> 252.2 (258.3) MB, pooled: 0 MB, 1399.47 / 0.00 ms  (+ 591.5 ms in 0 steps since start of marking, biggest step 0.0 ms, walltime since start of marking 2099 ms) (average mu = 0.518, current[80:0xea38000]    50593 ms: Mark-Compact 253.3 (258.3) -> 252.6 (259.8) MB, pooled: 0 MB, 1895.52 / 0.00 ms  (average mu = 0.331, current mu = 0.005) allocation failure; scavenge might not succeed
<--- JS stacktrace --->
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
----- Native stack trace -----
 1: 0xe13fde node::OOMErrorHandler(char const*, v8::OOMDetails const&) [node]
 2: 0x11d5070 v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, v8::OOMDetails const&) [node]
 3: 0x11d5347 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, v8::OOMDetails const&) [node]
 4: 0x1402c05  [node]
 5: 0x141c499 v8::internal::Heap::CollectGarbage(v8::internal::AllocationSpace, v8::internal::GarbageCollectionReason, v8::GCCallbackFlags) [node]
 6: 0x13f0b48 v8::internal::HeapAllocator::AllocateRawWithLightRetrySlowPath(int, v8::internal::AllocationType, v8::internal::AllocationOrigin, v8::internal::AllocationAlignment) [node]
 7: 0x13f1a75 v8::internal::HeapAllocator::AllocateRawWithRetryOrFailSlowPath(int, v8::internal::AllocationType, v8::internal::AllocationOrigin, v8::internal::AllocationAlignment) [node]
 8: 0x13ca74e v8::internal::Factory::NewFillerObject(int, v8::internal::AllocationAlignment, v8::internal::AllocationType, v8::internal::AllocationOrigin) [node]
 9: 0x182bd6c v8::internal::Runtime_AllocateInYoungGeneration(int, unsigned long*, v8::internal::Isolate*) [node]
10: 0x1d88476  [node]
Aborted (core dumped)
==> Exited with status 134
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'npm run start'
> printalma-back@0.0.1 start
> nest start
<--- Last few GCs --->
[62:0x45bf6000]    54805 ms: Mark-Compact 252.9 (258.8) -> 252.5 (259.6) MB, pooled: 0 MB, 2007.63 / 0.00 ms  (average mu = 0.390, current mu = 0.130) allocation failure; scavenge might not succeed
<--- JS stacktrace --->
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
----- Native stack trace -----
 1: 0xe13fde node::OOMErrorHandler(char const*, v8::OOMDetails const&) [node]
 2: 0x11d5070 v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, v8::OOMDetails const&) [node]
 3: 0x11d5347 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, v8::OOMDetails const&) [node]
 4: 0x1402c05  [node]
 5: 0x141c499 v8::internal::Heap::CollectGarbage(v8::internal::AllocationSpace, v8::internal::GarbageCollectionReason, v8::GCCallbackFlags) [node]
 6: 0x13f0b48 v8::internal::HeapAllocator::AllocateRawWithLightRetrySlowPath(int, v8::internal::AllocationType, v8::internal::AllocationOrigin, v8::internal::AllocationAlignment) [node]
 7: 0x13f1a75 v8::internal::HeapAllocator::AllocateRawWithRetryOrFailSlowPath(int, v8::internal::AllocationType, v8::internal::AllocationOrigin, v8::internal::AllocationAlignment) [node]
 8: 0x13ca74e v8::internal::Factory::NewFillerObject(int, v8::internal::AllocationAlignment, v8::internal::AllocationType, v8::internal::AllocationOrigin) [node]
 9: 0x182bd6c v8::internal::Runtime_AllocateInYoungGeneration(int, unsigned long*, v8::internal::Isolate*) [node]
10: 0x1d88476  [node]
Aborted (core dumped)