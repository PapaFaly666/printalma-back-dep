vendorProductValidationService.ts:58 
 
 PUT http://localhost:3004/vendor-product-validation/set-draft/99 403 (Forbidden)
vendorProductValidationService.ts:64 
 ❌ Erreur API: 
{message: 'Forbidden resource', error: 'Forbidden', statusCode: 403}
vendorProductValidationService.ts:80 
 ❌ Erreur lors de la définition du statut: Error: Forbidden resource
    at VendorProductValidationService.setProductStatus (vendorProductValidationService.ts:65:15)
    at async SellDesignPage.tsx:4067:39
    at async Promise.all (index 0)
    at async handlePublishProducts (SellDesignPage.tsx:4078:28)
SellDesignPage.tsx:4071 
 ❌ Erreur publication immédiate produit 99: Error: Forbidden resource
    at VendorProductValidationService.setProductStatus (vendorProductValidationService.ts:65:15)
    at async SellDesignPage.tsx:4067:39
    at async Promise.all (index 0)
    at async handlePublishProducts (SellDesignPage.tsx:4078:28)
vendorProductValidationService.ts:58 
 
 PUT http://localhost:3004/vendor-product-validation/set-draft/100 403 (Forbidden)
vendorProductValidationService.ts:64 
 ❌ Erreur API: 
{message: 'Forbidden resource', error: 'Forbidden', statusCode: 403}
vendorProductValidationService.ts:80 
 ❌ Erreur lors de la définition du statut: Error: Forbidden resource
    at VendorProductValidationService.setProductStatus (vendorProductValidationService.ts:65:15)
    at async SellDesignPage.tsx:4067:39
    at async Promise.all (index 1)
    at async handlePublishProducts (SellDesignPage.tsx:4078:28)
SellDesignPage.tsx:4071 
 ❌ Erreur publication immédiate produit 100: Error: Forbidden resource
    at VendorProductValidationService.setProductStatus (vendorProductValidationService.ts:65:15)
    at async SellDesignPage.tsx:4067:39
    at async Promise.all (index 1)
    at async handlePublishProducts (SellDesignPage.tsx:4078:28)
vendorProductValidationService.ts:58 
 
 PUT http://localhost:3004/vendor-product-validation/set-draft/101 403 (Forbidden)
vendorProductValidationService.ts:64 
 ❌ Erreur API: 
{message: 'Forbidden resource', error: 'Forbidden', statusCode: 403}
vendorProductValidationService.ts:80 
 ❌ Erreur lors de la définition du statut: Error: Forbidden resource
    at VendorProductValidationService.setProductStatus (vendorProductValidationService.ts:65:15)
    at async SellDesignPage.tsx:4067:39
    at async Promise.all (index 2)
    at async handlePublishProducts (SellDesignPage.tsx:4078:28)
SellDesignPage.tsx:4071 
 ❌ Erreur publication immédiate produit 101: Error: Forbidden resource
    at VendorProductValidationService.setProductStatus (vendorProductValidationService.ts:65:15)
    at async SellDesignPage.tsx:4067:39
    at async Promise.all (index 2)
    at async handlePublishProducts (SellDesignPage.tsx:4078:28)
SellDesignPage.tsx:4081 📊 Résultat publication: 0/3 produits effectivement publiés
VendorProductsPage.tsx:292 📡 Chargement des produits vendeur avec mockups et designs...
VendorProductsPage.tsx:292 📡 Chargement des produits vendeur avec mockups et designs...
VendorProductsPage.tsx:295 
 
 GET https://printalma-back-dep.onrender.com/vendor/products net::ERR_CONNECTION_CLOSED
VendorProductsPage.tsx:509 
 ❌ Erreur: TypeError: Failed to fetch
    at loadProducts (VendorProductsPage.tsx:295:30)
    at VendorProductsPage.tsx:517:5
VendorProductsPage.tsx:295 
 
 GET https://printalma-back-dep.onrender.com/vendor/products net::ERR_CONNECTION_CLOSED
VendorProductsPage.tsx:509 
 ❌ Erreur: TypeError: Failed to fetch
    at loadProducts (VendorProductsPage.tsx:295:30)
    at VendorProductsPage.tsx:517:5
