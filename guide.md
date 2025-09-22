📤 Envoi du payload wizard (complet): {baseProductId: 33, vendorName: 'sweat-baayFall-noir (2)', vendorDescription: 'rrrrrrrrrrrr', vendorPrice: 12000, vendorStock: 10, …}baseProductId: 33forcedStatus: "PUBLISHED"productImages: baseImage: "data:image/webp;base64,UklGRjRCAABXRUJQVlA4WAoAAAdetailImages: Array(3)0: "data:image/webp;base64,UklGRsYjAABXRUJQVlA4WAoAAA1: "data:image/webp;base64,UklGRq4dAABXRUJQVlA4WAoAAA2: "data:image/webp;base64,UklGRoYmAABXRUJQVlA4WAoAAAlength: 3[[Prototype]]: Array(0)[[Prototype]]: ObjectselectedColors: Array(1)0: colorCode: "#000000"id: 32name: "Noir"[[Prototype]]: Objectlength: 1[[Prototype]]: Array(0)selectedSizes: Array(1)0: id: 156sizeName: "400ml"[[Prototype]]: Objectlength: 1[[Prototype]]: Array(0)vendorDescription: "rrrrrrrrrrrr"vendorName: "sweat-baayFall-noir (2)"vendorPrice: 12000vendorStock: 10[[Prototype]]: Object
useWizardProductUpload.ts:341 🔍 Vérification finale du JSON qui sera envoyé:
useWizardProductUpload.ts:342   - baseProductId: 33
useWizardProductUpload.ts:343   - type: number
useWizardProductUpload.ts:344   - isNumber: true
useWizardProductUpload.ts:345   - isNaN: false
useWizardProductUpload.ts:346   - isPositive: true
useWizardProductUpload.ts:349 📤 JSON brut (première partie): {"baseProductId":33,"vendorName":"sweat-baayFall-noir (2)","vendorDescription":"rrrrrrrrrrrr","vendorPrice":12000,"vendorStock":10,"selectedColors":[{"id":32,"name":"Noir","colorCode":"#000000"}],"sel
useWizardProductUpload.ts:361 🔑 Fallback vers authentification par cookies
useWizardProductUpload.ts:364   POST http://localhost:3004/vendor/wizard-products 400 (Bad Request)
uploadProduct @ useWizardProductUpload.ts:364
await in uploadProduct
handleSubmit @ ProductCreationWizard.tsx:425
onClick @ ProductCreationWizard.tsx:1342
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
<button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
Button @ button.tsx:51
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performSyncWorkOnRoot @ react-dom-client.development.js:16231
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16079
processRootScheduleInMicrotask @ react-dom-client.development.js:16116
(anonymous) @ react-dom-client.development.js:16250
<Button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
ProductCreationWizard @ ProductCreationWizard.tsx:1341
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performSyncWorkOnRoot @ react-dom-client.development.js:16231
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16079
processRootScheduleInMicrotask @ react-dom-client.development.js:16116
(anonymous) @ react-dom-client.development.js:16250
useWizardProductUpload.ts:372 Upload wizard product: {productName: 'sweat-baayFall-noir (2)', productPrice: 12000, basePrice: 10000, profit: 2000, revenue: 1400, …}
useWizardProductUpload.ts:410  ❌ Erreur wizard endpoint: 
[31mInvalid [1m`tx.vendorProduct.create()`[22m invocation in[39m
[4m/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/vendor-product/vendor-wizard-product.service.ts:95:48[24m

  [2m[90m92[39m [90m// 5. Créer le produit wizard dans une transaction[39m[22m
  [2m[90m93[39m [36mconst[39m wizardProduct = [36mawait[39m [36mthis[39m[34m.[39mprisma[34m.[39m[36m$transaction[39m[34m([39m[36masync[39m [34m([39mtx[34m)[39m => [34m{[39m[22m
  [2m[90m94[39m   [90m// Créer le produit[39m[22m
[1m[31m→[39m[22m [2m[90m95[39m   [36mconst[39m product = [36mawait[39m tx[34m.[39mvendorProduct[34m.[39m[36mcreate[39m[34m([39m[22m{
         data: {
           vendorId: 7,
           baseProductId: 33,
           name: "sweat-baayFall-noir (2)",
           description: "rrrrrrrrrrrr",
           price: 12000,
           stock: 10,
           status: "PUBLISHED",
           designId: null,
           sizes: [
             {
               id: 156,
               sizeName: "400ml"
             }
           ],
           colors: [
             {
               id: 32,
               name: "Noir",
               colorCode: "#000000"
             }
           ],
           vendorName: "sweat-baayFall-noir (2)",
           vendorDescription: "rrrrrrrrrrrr",
           vendorStock: 10
         },
         include: {
           [31mproduct[39m: true,
           [31m~~~~~~~[39m
       [32m?[39m   [32mdesignProductLinks[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mdesignPositions[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mdesignTransforms[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mbaseProduct[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mdesign[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mvalidator[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mvendor[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mimages[39m[32m?[39m[32m: [39m[32mtrue[39m
         }
       }[2m)[22m

Unknown field [31m`product`[39m for [1minclude[22m statement on model [1m`VendorProduct`[22m. Available options are listed in [32mgreen[39m.
uploadProduct @ useWizardProductUpload.ts:410
await in uploadProduct
handleSubmit @ ProductCreationWizard.tsx:425
onClick @ ProductCreationWizard.tsx:1342
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
<button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
Button @ button.tsx:51
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performSyncWorkOnRoot @ react-dom-client.development.js:16231
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16079
processRootScheduleInMicrotask @ react-dom-client.development.js:16116
(anonymous) @ react-dom-client.development.js:16250
<Button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
ProductCreationWizard @ ProductCreationWizard.tsx:1341
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performSyncWorkOnRoot @ react-dom-client.development.js:16231
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16079
processRootScheduleInMicrotask @ react-dom-client.development.js:16116
(anonymous) @ react-dom-client.development.js:16250
useWizardProductUpload.ts:423  Error uploading wizard product: Error: 
[31mInvalid [1m`tx.vendorProduct.create()`[22m invocation in[39m
[4m/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/vendor-product/vendor-wizard-product.service.ts:95:48[24m

  [2m[90m92[39m [90m// 5. Créer le produit wizard dans une transaction[39m[22m
  [2m[90m93[39m [36mconst[39m wizardProduct = [36mawait[39m [36mthis[39m[34m.[39mprisma[34m.[39m[36m$transaction[39m[34m([39m[36masync[39m [34m([39mtx[34m)[39m => [34m{[39m[22m
  [2m[90m94[39m   [90m// Créer le produit[39m[22m
[1m[31m→[39m[22m [2m[90m95[39m   [36mconst[39m product = [36mawait[39m tx[34m.[39mvendorProduct[34m.[39m[36mcreate[39m[34m([39m[22m{
         data: {
           vendorId: 7,
           baseProductId: 33,
           name: "sweat-baayFall-noir (2)",
           description: "rrrrrrrrrrrr",
           price: 12000,
           stock: 10,
           status: "PUBLISHED",
           designId: null,
           sizes: [
             {
               id: 156,
               sizeName: "400ml"
             }
           ],
           colors: [
             {
               id: 32,
               name: "Noir",
               colorCode: "#000000"
             }
           ],
           vendorName: "sweat-baayFall-noir (2)",
           vendorDescription: "rrrrrrrrrrrr",
           vendorStock: 10
         },
         include: {
           [31mproduct[39m: true,
           [31m~~~~~~~[39m
       [32m?[39m   [32mdesignProductLinks[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mdesignPositions[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mdesignTransforms[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mbaseProduct[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mdesign[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mvalidator[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mvendor[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mimages[39m[32m?[39m[32m: [39m[32mtrue[39m
         }
       }[2m)[22m

Unknown field [31m`product`[39m for [1minclude[22m statement on model [1m`VendorProduct`[22m. Available options are listed in [32mgreen[39m.
    at uploadProduct (useWizardProductUpload.ts:412:15)
    at async handleSubmit (ProductCreationWizard.tsx:425:22)
uploadProduct @ useWizardProductUpload.ts:423
await in uploadProduct
handleSubmit @ ProductCreationWizard.tsx:425
onClick @ ProductCreationWizard.tsx:1342
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
<button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
Button @ button.tsx:51
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performSyncWorkOnRoot @ react-dom-client.development.js:16231
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16079
processRootScheduleInMicrotask @ react-dom-client.development.js:16116
(anonymous) @ react-dom-client.development.js:16250
<Button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:346
ProductCreationWizard @ ProductCreationWizard.tsx:1341
react_stack_bottom_frame @ react-dom-client.development.js:23863
renderWithHooksAgain @ react-dom-client.development.js:5629
renderWithHooks @ react-dom-client.development.js:5541
updateFunctionComponent @ react-dom-client.development.js:8897
beginWork @ react-dom-client.development.js:10522
runWithFiberInDEV @ react-dom-client.development.js:1519
performUnitOfWork @ react-dom-client.development.js:15132
workLoopSync @ react-dom-client.development.js:14956
renderRootSync @ react-dom-client.development.js:14936
performWorkOnRoot @ react-dom-client.development.js:14419
performSyncWorkOnRoot @ react-dom-client.development.js:16231
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16079
processRootScheduleInMicrotask @ react-dom-client.development.js:16116
(anonymous) @ react-dom-client.development.js:16250
ProductCreationWizard.tsx:438  Erreur création produit wizard: Error: 
[31mInvalid [1m`tx.vendorProduct.create()`[22m invocation in[39m
[4m/mnt/c/Users/HP/Desktop/printalma-perso/printalma-back-dep/src/vendor-product/vendor-wizard-product.service.ts:95:48[24m

  [2m[90m92[39m [90m// 5. Créer le produit wizard dans une transaction[39m[22m
  [2m[90m93[39m [36mconst[39m wizardProduct = [36mawait[39m [36mthis[39m[34m.[39mprisma[34m.[39m[36m$transaction[39m[34m([39m[36masync[39m [34m([39mtx[34m)[39m => [34m{[39m[22m
  [2m[90m94[39m   [90m// Créer le produit[39m[22m
[1m[31m→[39m[22m [2m[90m95[39m   [36mconst[39m product = [36mawait[39m tx[34m.[39mvendorProduct[34m.[39m[36mcreate[39m[34m([39m[22m{
         data: {
           vendorId: 7,
           baseProductId: 33,
           name: "sweat-baayFall-noir (2)",
           description: "rrrrrrrrrrrr",
           price: 12000,
           stock: 10,
           status: "PUBLISHED",
           designId: null,
           sizes: [
             {
               id: 156,
               sizeName: "400ml"
             }
           ],
           colors: [
             {
               id: 32,
               name: "Noir",
               colorCode: "#000000"
             }
           ],
           vendorName: "sweat-baayFall-noir (2)",
           vendorDescription: "rrrrrrrrrrrr",
           vendorStock: 10
         },
         include: {
           [31mproduct[39m: true,
           [31m~~~~~~~[39m
       [32m?[39m   [32mdesignProductLinks[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mdesignPositions[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mdesignTransforms[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mbaseProduct[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mdesign[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mvalidator[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mvendor[39m[32m?[39m[32m: [39m[32mtrue[39m,
       [32m?[39m   [32mimages[39m[32m?[39m[32m: [39m[32mtrue[39m
         }
       }[2m)[22m

Unknown field [31m`product`[39m for [1minclude[22m statement on model [1m`VendorProduct`[22m. Available options are listed in [32mgreen[39m.
    at uploadProduct (useWizardProductUpload.ts:412:15)
    at async handleSubmit (ProductCreationWizard.tsx:425:22)