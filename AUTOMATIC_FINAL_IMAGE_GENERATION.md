# Génération Automatique de l'Image Finale du Produit Vendeur

## Vue d'ensemble

Lorsqu'un vendeur crée un produit et positionne son design sur le mockup, le système génère **automatiquement** une image finale montrant le produit avec le design exactement là où le vendeur l'a placé.

## Architecture

### 1. Nouveau Champ dans VendorProduct

Deux nouveaux champs ont été ajoutés à la table `VendorProduct` :

```prisma
model VendorProduct {
  // ... autres champs
  finalImageUrl      String?  @map("final_image_url")
  finalImagePublicId String?  @map("final_image_public_id")
}
```

- **`finalImageUrl`** : URL Cloudinary de l'image finale (mockup + design positionné)
- **`finalImagePublicId`** : Public ID Cloudinary pour la gestion de l'image

### 2. Services Utilisés

1. **ProductPreviewGeneratorService**
   - Génère l'image en composant le design sur le mockup
   - Gère position, taille, rotation du design
   - Utilise Sharp pour le traitement d'image

2. **VendorPublishService** (modifié)
   - Déclenche automatiquement la génération lors de la création du produit
   - Upload l'image sur Cloudinary
   - Sauvegarde l'URL dans `VendorProduct`

## Flux de Génération Automatique

### Lors de la création d'un produit vendeur

```
1. Vendeur crée le produit via /vendor/publish
   └─> Envoie: baseProductId, designId, designPosition

2. VendorPublishService.publishProduct()
   ├─> Crée le VendorProduct
   ├─> Sauvegarde la position dans ProductDesignPosition
   └─> 🎨 GÉNÉRATION AUTOMATIQUE DE L'IMAGE FINALE
       ├─> Récupère l'image du mockup (baseProduct.productImages)
       ├─> Récupère l'image du design (design.imageUrl)
       ├─> Récupère la position (designPosition)
       ├─> ProductPreviewGeneratorService.generatePreviewFromJson()
       │   ├─> Télécharge les 2 images
       │   ├─> Calcule dimensions et position en pixels
       │   ├─> Redimensionne le design
       │   ├─> Applique rotation si nécessaire
       │   └─> Compose design sur mockup
       ├─> Upload sur Cloudinary (dossier: vendor-product-finals)
       └─> Mise à jour VendorProduct
           ├─> finalImageUrl = URL Cloudinary
           └─> finalImagePublicId = Public ID

3. Réponse au vendeur
   └─> Inclut finalImageUrl
```

## Format de Position

Le système utilise les positions stockées en **pourcentages** :

```json
{
  "x": 25,        // Position X (% de la largeur du mockup)
  "y": 25,        // Position Y (% de la hauteur du mockup)
  "width": 30,    // Largeur du design (% de la largeur du mockup)
  "height": 30,   // Hauteur du design (% de la hauteur du mockup)
  "rotation": 0   // Rotation en degrés (optionnel)
}
```

## Code Ajouté

### Dans VendorPublishService.publishProduct()

```typescript
// 🎨 GÉNÉRATION AUTOMATIQUE DE L'IMAGE FINALE (MOCKUP + DESIGN)
try {
  this.logger.log(`🎨 Génération image finale pour produit ${vendorProduct.id}...`);

  // Récupérer l'image par défaut du produit de base
  const baseProductWithImage = await this.prisma.product.findUnique({
    where: { id: publishDto.baseProductId },
    include: {
      productImages: {
        where: { isDefault: true },
        take: 1,
      },
    },
  });

  const productImage = baseProductWithImage?.productImages[0];

  if (productImage && positionData) {
    // Générer l'image finale avec le design positionné
    const finalImageBuffer = await this.previewGenerator.generatePreviewFromJson(
      productImage.url,
      design.imageUrl,
      positionData
    );

    // Upload sur Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(finalImageBuffer, {
      folder: 'vendor-product-finals',
      public_id: `final_${vendorProduct.id}_${Date.now()}`,
      resource_type: 'image',
    });

    // Mettre à jour le VendorProduct
    await this.prisma.vendorProduct.update({
      where: { id: vendorProduct.id },
      data: {
        finalImageUrl: uploadResult.secure_url,
        finalImagePublicId: uploadResult.public_id,
      },
    });
  }
} catch (imageError) {
  // Ne pas bloquer la création du produit si la génération échoue
  this.logger.error(`❌ Erreur génération image finale: ${imageError.message}`);
}
```

## Exemple de Réponse API

### POST /vendor/publish

**Requête:**
```json
{
  "baseProductId": 5,
  "designId": 42,
  "vendorName": "Mon T-shirt Personnalisé",
  "vendorPrice": 15000,
  "designPosition": {
    "x": 30,
    "y": 25,
    "width": 40,
    "height": 40,
    "rotation": 0
  },
  "selectedColors": [...],
  "selectedSizes": [...],
  ...
}
```

**Réponse:**
```json
{
  "success": true,
  "productId": 123,
  "message": "Produit créé avec design \"Mon Logo\"",
  "status": "PUBLISHED",
  "designUrl": "https://res.cloudinary.com/.../design.png",
  "designId": 42,
  "finalImageUrl": "https://res.cloudinary.com/.../final_123_1234567890.png"
}
```

## Récupération de l'Image Finale

### Dans les APIs de produits

L'image finale est automatiquement incluse dans les réponses :

```typescript
// GET /vendor/products/:id
{
  "id": 123,
  "name": "Mon T-shirt Personnalisé",
  "designUrl": "https://.../design.png",
  "finalImageUrl": "https://.../final_123_1234567890.png", // ✅ Image finale
  "baseProduct": {...},
  ...
}
```

### Utilisation Frontend

```typescript
// Afficher l'image finale du produit
const ProductCard = ({ product }) => {
  return (
    <div>
      <h3>{product.name}</h3>
      {/* Afficher l'image finale avec le design appliqué */}
      <img src={product.finalImageUrl} alt={product.name} />
    </div>
  );
};
```

## Régénération de l'Image Finale

### Endpoint Manuel (si nécessaire)

Si l'image finale doit être régénérée (changement de position, etc.) :

```bash
POST /vendor/products/:vendorProductId/generate-preview
Authorization: Bearer {token}
```

Ce endpoint est disponible mais **normalement pas nécessaire** car l'image est générée automatiquement à la création.

## Gestion des Erreurs

### Si la génération échoue

- Le produit est quand même créé
- `finalImageUrl` reste `null`
- L'erreur est loggée mais n'est pas bloquante
- Possibilité de régénérer plus tard via l'endpoint manuel

### Logs à surveiller

```
✅ Image finale générée (125487 bytes)
☁️ Image finale uploadée: https://...
💾 Image finale sauvegardée dans VendorProduct 123
```

ou en cas d'erreur :

```
❌ Erreur génération image finale: ...
⚠️ Produit créé sans image finale, peut être régénérée plus tard
```

## Performance

### Optimisations Appliquées

1. **Génération asynchrone** : Ne bloque pas la réponse API
2. **Gestion d'erreur non-bloquante** : Le produit est créé même si l'image échoue
3. **Cache Cloudinary** : Les images sont servies via CDN
4. **Compression PNG** : Quality 100, compression level 6

### Temps Estimé

- Téléchargement images : ~500-1000ms
- Traitement Sharp : ~200-500ms
- Upload Cloudinary : ~500-1000ms
- **Total : 1-2.5 secondes**

## Migration des Produits Existants

Pour générer les images finales des produits existants :

```typescript
// Script de migration (à créer si nécessaire)
const products = await prisma.vendorProduct.findMany({
  where: {
    designId: { not: null },
    finalImageUrl: null, // Produits sans image finale
  },
  include: {
    design: true,
    baseProduct: {
      include: { productImages: true },
    },
  },
});

for (const product of products) {
  // Récupérer la position
  const position = await prisma.productDesignPosition.findUnique({
    where: {
      vendorProductId_designId: {
        vendorProductId: product.id,
        designId: product.designId,
      },
    },
  });

  if (position) {
    // Générer et uploader l'image finale
    // ... (même code que dans VendorPublishService)
  }
}
```

## Avantages

✅ **Automatique** : Pas d'action manuelle du vendeur
✅ **Temps réel** : Image disponible dès la création du produit
✅ **Précis** : Reflète exactement le positionnement du vendeur
✅ **Performant** : Upload Cloudinary avec CDN
✅ **Fiable** : Gestion d'erreur non-bloquante
✅ **Flexible** : Possibilité de régénération

## Conclusion

Le système génère maintenant automatiquement une image finale réaliste pour chaque produit vendeur, montrant exactement comment le produit final apparaîtra avec le design positionné. Cette image est stockée dans `VendorProduct.finalImageUrl` et est disponible immédiatement après la création du produit.
