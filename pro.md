POST http://localhost:3004/vendor/wizard-products 400 (Bad Request)
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
useWizardProductUpload.ts:372 Upload wizard product: {productName: 'C63 ', productPrice: 12000, basePrice: 10000, profit: 2000, revenue: 1400, …}
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
           name: "C63",
           description: "fezfz e fezf",
           price: 12000,
           stock: 10,
           status: "PUBLISHED",
           designId: null,
           sizes: [
             {
               id: 155,
               sizeName: "350ml"
             },
             {
               id: 154,
               sizeName: "300ml"
             }
           ],
           colors: [
             {
               id: 32,
               name: "Noir",
               colorCode: "#000000"
             },
             {
               id: 33,
               name: "Rouge",
               colorCode: "#ec0909"
             }
           ],
           [31moriginalAdminName[39m: "Mugs",
           [31m~~~~~~~~~~~~~~~~~[39m
           vendorName: "C63",
           vendorDescription: "fezfz e fezf",
           vendorStock: 10,
       [32m?[39m   [32mid[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32misDelete[39m[32m?[39m[32m: [39m[32mBoolean[39m,
       [32m?[39m   [32mpostValidationAction[39m[32m?[39m[32m: [39m[32mPostValidationAction[39m,
       [32m?[39m   [32madminProductName[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32madminProductDescription[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32madminProductPrice[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mdesignBase64[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignCloudinaryUrl[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignCloudinaryPublicId[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignPositioning[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignScale[39m[32m?[39m[32m: [39m[32mFloat | Null[39m,
       [32m?[39m   [32mdesignApplicationMode[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32msalesCount[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mtotalRevenue[39m[32m?[39m[32m: [39m[32mFloat[39m,
       [32m?[39m   [32maverageRating[39m[32m?[39m[32m: [39m[32mFloat | Null[39m,
       [32m?[39m   [32mlastSaleDate[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32misBestSeller[39m[32m?[39m[32m: [39m[32mBoolean[39m,
       [32m?[39m   [32mbestSellerRank[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mbestSellerCategory[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mviewsCount[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mdesignWidth[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mdesignHeight[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mdesignFormat[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignFileSize[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mbasePriceAdmin[39m[32m?[39m[32m: [39m[32mFloat[39m,
       [32m?[39m   [32misValidated[39m[32m?[39m[32m: [39m[32mBoolean[39m,
       [32m?[39m   [32mvalidatedAt[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32mvalidatedBy[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mrejectionReason[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32msubmittedForValidationAt[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32mcreatedAt[39m[32m?[39m[32m: [39m[32mDateTime[39m,
       [32m?[39m   [32mupdatedAt[39m[32m?[39m[32m: [39m[32mDateTime[39m,
       [32m?[39m   [32mdesignProductLinks[39m[32m?[39m[32m: [39m[32mDesignProductLinkUncheckedCreateNestedManyWithoutVendorProductInput[39m,
       [32m?[39m   [32mdesignPositions[39m[32m?[39m[32m: [39m[32mProductDesignPositionUncheckedCreateNestedManyWithoutVendorProductInput[39m,
       [32m?[39m   [32mdesignTransforms[39m[32m?[39m[32m: [39m[32mVendorDesignTransformUncheckedCreateNestedManyWithoutVendorProductInput[39m,
       [32m?[39m   [32mimages[39m[32m?[39m[32m: [39m[32mVendorProductImageUncheckedCreateNestedManyWithoutVendorProductInput[39m
         },
         include: {
           baseProduct: true,
           design: true,
           validator: true,
           vendor: true,
           images: true
         }
       }[2m)[22m

Unknown argument `[31moriginalAdminName[39m`. Available options are listed in [32mgreen[39m.
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
           name: "C63",
           description: "fezfz e fezf",
           price: 12000,
           stock: 10,
           status: "PUBLISHED",
           designId: null,
           sizes: [
             {
               id: 155,
               sizeName: "350ml"
             },
             {
               id: 154,
               sizeName: "300ml"
             }
           ],
           colors: [
             {
               id: 32,
               name: "Noir",
               colorCode: "#000000"
             },
             {
               id: 33,
               name: "Rouge",
               colorCode: "#ec0909"
             }
           ],
           [31moriginalAdminName[39m: "Mugs",
           [31m~~~~~~~~~~~~~~~~~[39m
           vendorName: "C63",
           vendorDescription: "fezfz e fezf",
           vendorStock: 10,
       [32m?[39m   [32mid[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32misDelete[39m[32m?[39m[32m: [39m[32mBoolean[39m,
       [32m?[39m   [32mpostValidationAction[39m[32m?[39m[32m: [39m[32mPostValidationAction[39m,
       [32m?[39m   [32madminProductName[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32madminProductDescription[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32madminProductPrice[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mdesignBase64[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignCloudinaryUrl[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignCloudinaryPublicId[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignPositioning[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignScale[39m[32m?[39m[32m: [39m[32mFloat | Null[39m,
       [32m?[39m   [32mdesignApplicationMode[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32msalesCount[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mtotalRevenue[39m[32m?[39m[32m: [39m[32mFloat[39m,
       [32m?[39m   [32maverageRating[39m[32m?[39m[32m: [39m[32mFloat | Null[39m,
       [32m?[39m   [32mlastSaleDate[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32misBestSeller[39m[32m?[39m[32m: [39m[32mBoolean[39m,
       [32m?[39m   [32mbestSellerRank[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mbestSellerCategory[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mviewsCount[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mdesignWidth[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mdesignHeight[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mdesignFormat[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignFileSize[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mbasePriceAdmin[39m[32m?[39m[32m: [39m[32mFloat[39m,
       [32m?[39m   [32misValidated[39m[32m?[39m[32m: [39m[32mBoolean[39m,
       [32m?[39m   [32mvalidatedAt[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32mvalidatedBy[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mrejectionReason[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32msubmittedForValidationAt[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32mcreatedAt[39m[32m?[39m[32m: [39m[32mDateTime[39m,
       [32m?[39m   [32mupdatedAt[39m[32m?[39m[32m: [39m[32mDateTime[39m,
       [32m?[39m   [32mdesignProductLinks[39m[32m?[39m[32m: [39m[32mDesignProductLinkUncheckedCreateNestedManyWithoutVendorProductInput[39m,
       [32m?[39m   [32mdesignPositions[39m[32m?[39m[32m: [39m[32mProductDesignPositionUncheckedCreateNestedManyWithoutVendorProductInput[39m,
       [32m?[39m   [32mdesignTransforms[39m[32m?[39m[32m: [39m[32mVendorDesignTransformUncheckedCreateNestedManyWithoutVendorProductInput[39m,
       [32m?[39m   [32mimages[39m[32m?[39m[32m: [39m[32mVendorProductImageUncheckedCreateNestedManyWithoutVendorProductInput[39m
         },
         include: {
           baseProduct: true,
           design: true,
           validator: true,
           vendor: true,
           images: true
         }
       }[2m)[22m

Unknown argument `[31moriginalAdminName[39m`. Available options are listed in [32mgreen[39m.
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
           name: "C63",
           description: "fezfz e fezf",
           price: 12000,
           stock: 10,
           status: "PUBLISHED",
           designId: null,
           sizes: [
             {
               id: 155,
               sizeName: "350ml"
             },
             {
               id: 154,
               sizeName: "300ml"
             }
           ],
           colors: [
             {
               id: 32,
               name: "Noir",
               colorCode: "#000000"
             },
             {
               id: 33,
               name: "Rouge",
               colorCode: "#ec0909"
             }
           ],
           [31moriginalAdminName[39m: "Mugs",
           [31m~~~~~~~~~~~~~~~~~[39m
           vendorName: "C63",
           vendorDescription: "fezfz e fezf",
           vendorStock: 10,
       [32m?[39m   [32mid[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32misDelete[39m[32m?[39m[32m: [39m[32mBoolean[39m,
       [32m?[39m   [32mpostValidationAction[39m[32m?[39m[32m: [39m[32mPostValidationAction[39m,
       [32m?[39m   [32madminProductName[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32madminProductDescription[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32madminProductPrice[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mdesignBase64[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignCloudinaryUrl[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignCloudinaryPublicId[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignPositioning[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignScale[39m[32m?[39m[32m: [39m[32mFloat | Null[39m,
       [32m?[39m   [32mdesignApplicationMode[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32msalesCount[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mtotalRevenue[39m[32m?[39m[32m: [39m[32mFloat[39m,
       [32m?[39m   [32maverageRating[39m[32m?[39m[32m: [39m[32mFloat | Null[39m,
       [32m?[39m   [32mlastSaleDate[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32misBestSeller[39m[32m?[39m[32m: [39m[32mBoolean[39m,
       [32m?[39m   [32mbestSellerRank[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mbestSellerCategory[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mviewsCount[39m[32m?[39m[32m: [39m[32mInt[39m,
       [32m?[39m   [32mdesignWidth[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mdesignHeight[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mdesignFormat[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32mdesignFileSize[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mbasePriceAdmin[39m[32m?[39m[32m: [39m[32mFloat[39m,
       [32m?[39m   [32misValidated[39m[32m?[39m[32m: [39m[32mBoolean[39m,
       [32m?[39m   [32mvalidatedAt[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32mvalidatedBy[39m[32m?[39m[32m: [39m[32mInt | Null[39m,
       [32m?[39m   [32mrejectionReason[39m[32m?[39m[32m: [39m[32mString | Null[39m,
       [32m?[39m   [32msubmittedForValidationAt[39m[32m?[39m[32m: [39m[32mDateTime | Null[39m,
       [32m?[39m   [32mcreatedAt[39m[32m?[39m[32m: [39m[32mDateTime[39m,
       [32m?[39m   [32mupdatedAt[39m[32m?[39m[32m: [39m[32mDateTime[39m,
       [32m?[39m   [32mdesignProductLinks[39m[32m?[39m[32m: [39m[32mDesignProductLinkUncheckedCreateNestedManyWithoutVendorProductInput[39m,
       [32m?[39m   [32mdesignPositions[39m[32m?[39m[32m: [39m[32mProductDesignPositionUncheckedCreateNestedManyWithoutVendorProductInput[39m,
       [32m?[39m   [32mdesignTransforms[39m[32m?[39m[32m: [39m[32mVendorDesignTransformUncheckedCreateNestedManyWithoutVendorProductInput[39m,
       [32m?[39m   [32mimages[39m[32m?[39m[32m: [39m[32mVendorProductImageUncheckedCreateNestedManyWithoutVendorProductInput[39m
         },
         include: {
           baseProduct: true,
           design: true,
           validator: true,
           vendor: true,
           images: true
         }
       }[2m)[22m

Unknown argument `[31moriginalAdminName[39m`. Available options are listed in [32mgreen[39m.
    at uploadProduct (useWizardProductUpload.ts:412:15)
    at async handleSubmit (ProductCreationWizard.tsx:425:22)
handleSubmit @ ProductCreationWizard.tsx:438
await in handleSubmit
onClick @ ProductCreationWizard.tsx:1342
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626