🔄 [ProductService] Création du produit...
productService.ts:324 🔍 [DEBUG] Données reçues: {
  "name": "Meghan Jenkins",
  "description": "Qui aspernatur volup",
  "price": 772,
  "suggestedPrice": 772,
  "stock": 83,
  "status": "published",
  "categoryId": 5,
  "subCategoryId": 5,
  "variationId": 11,
  "sizes": [
    "fezfez",
    "fzefze"
  ],
  "genre": "UNISEXE",
  "isReadyProduct": false,
  "colorVariations": [
    {
      "name": "ddd",
      "colorCode": "#ffffff",
      "stockBySize": {
        "fezfez": 10,
        "fzefze": 23
      },
      "images": [
        {
          "fileId": "1760398128237",
          "view": "Front",
          "delimitations": [
            {
              "x": 330.3918298723084,
              "y": 440.2939750145284,
              "width": 843.1371887567437,
              "height": 862.7450374528487,
              "rotation": 0
            }
          ]
        }
      ]
    }
  ]
}
productService.ts:325 🔍 [DEBUG] Images reçues: 1
productService.ts:326 🔍 [DEBUG] Genre reçu: UNISEXE
productService.ts:327 🔍 [DEBUG] Genre sera envoyé: UNISEXE
productService.ts:432 ❌ [ProductService] Erreur création produit: Error: Au moins une catégorie est requise
    at ProductService.createProduct (productService.ts:335:15)
    at useProductForm.ts:276:43
    at handleSubmit (ProductFormMain.tsx:1612:13)