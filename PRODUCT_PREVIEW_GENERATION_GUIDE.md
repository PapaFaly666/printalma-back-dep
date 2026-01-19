# Guide de Génération des Previews de Produits

## Vue d'ensemble

Ce système génère automatiquement des images de preview montrant le produit avec le design placé exactement là où le vendeur l'a positionné.

## Architecture

### Services créés

1. **ProductPreviewGeneratorService** (`src/vendor-product/services/product-preview-generator.service.ts`)
   - Génère l'image de preview en composant le design sur le produit
   - Gère le positionnement, redimensionnement et rotation du design
   - Utilise Sharp pour le traitement d'images

2. **ProductPreviewController** (`src/vendor-product/product-preview.controller.ts`)
   - Endpoint pour générer/régénérer les previews
   - Upload automatique sur Cloudinary
   - Sauvegarde dans la base de données

## Fonctionnement

### 1. Génération de Preview

```typescript
POST /vendor/products/:vendorProductId/generate-preview
Authorization: Bearer {token}
```

**Processus:**
1. Récupère le `VendorProduct` avec son `baseProduct` et `design`
2. Récupère la position du design depuis `ProductDesignPosition`
3. Télécharge l'image du produit et l'image du design
4. Calcule les dimensions en pixels à partir des pourcentages
5. Redimensionne et positionne le design
6. Applique la rotation si nécessaire
7. Compose le design sur le produit
8. Upload le résultat sur Cloudinary
9. Sauvegarde dans `VendorProductImage` avec `imageType = 'preview'`

### 2. Format de Position

Le système utilise les positions stockées dans `ProductDesignPosition`:

```json
{
  "x": 25,        // Position X (% de la largeur du produit)
  "y": 25,        // Position Y (% de la hauteur du produit)
  "width": 30,    // Largeur du design (% de la largeur du produit)
  "height": 30,   // Hauteur du design (% de la hauteur du produit)
  "rotation": 0   // Rotation en degrés
}
```

### 3. Stockage des Previews

Les images de preview sont stockées dans `VendorProductImage`:
- `imageType = 'preview'`
- `cloudinaryUrl` contient l'URL de la preview
- `cloudinaryPublicId` pour la gestion Cloudinary

## Utilisation

### Générer une preview pour un produit

```bash
curl -X POST \
  http://localhost:3000/vendor/products/123/generate-preview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse:**
```json
{
  "success": true,
  "message": "Preview du produit générée avec succès",
  "data": {
    "previewUrl": "https://res.cloudinary.com/.../product_preview_123_1234567890.png",
    "previewId": 456,
    "productId": 123
  }
}
```

### Récupérer les previews d'un produit

Les previews sont disponibles dans `VendorProductImage`:

```typescript
const previews = await prisma.vendorProductImage.findMany({
  where: {
    vendorProductId: 123,
    imageType: 'preview'
  }
});
```

## Intégration avec le Workflow Existant

### Option 1: Génération Automatique lors de la Création

Modifiez `VendorWizardProductService.createWizardProduct()` pour générer automatiquement la preview:

```typescript
// Après la création du produit
const previewBuffer = await this.previewGenerator.generatePreviewFromJson(
  productImage.url,
  designUrl,
  designPosition
);

const uploadResult = await this.cloudinary.uploadImage(previewBuffer, {
  folder: 'product-previews',
  public_id: `product_preview_${product.id}_${Date.now()}`,
});

await this.prisma.vendorProductImage.create({
  data: {
    vendorProductId: product.id,
    imageType: 'preview',
    cloudinaryUrl: uploadResult.secure_url,
    cloudinaryPublicId: uploadResult.public_id,
    // ...
  }
});
```

### Option 2: Génération Automatique lors du Changement de Position

Modifiez `DesignPositionService.upsertPosition()` pour régénérer la preview:

```typescript
async upsertPosition(...) {
  // Code existant...
  const record = await this.prisma.productDesignPosition.upsert(...);

  // Déclencher la régénération de la preview
  await this.regenerateProductPreview(vendorProductId);

  return record;
}
```

## Améliorations Futures

### 1. Génération en Background

Utiliser une queue (Bull/BullMQ) pour générer les previews de manière asynchrone:

```typescript
@Post(':vendorProductId/generate-preview')
async generatePreview(@Param('vendorProductId') id: number) {
  await this.previewQueue.add('generate-preview', { productId: id });
  return { message: 'Preview en cours de génération' };
}
```

### 2. Cache des Previews

Implémenter un système de cache pour éviter de régénérer les previews inutilement:

```typescript
const cacheKey = `preview_${vendorProductId}_${designPositionHash}`;
const cached = await this.cache.get(cacheKey);
if (cached) return cached;
```

### 3. Support de Multiples Designs

Permettre de composer plusieurs designs sur un même produit:

```typescript
interface MultiDesignConfig {
  productImageUrl: string;
  designs: Array<{
    imageUrl: string;
    position: Position;
  }>;
}
```

### 4. Zones d'Impression (Print Areas)

Respecter les zones d'impression définies sur le produit:

```typescript
if (printArea) {
  // Vérifier que le design est dans la zone d'impression
  if (!isWithinPrintArea(position, printArea)) {
    throw new Error('Design hors de la zone d'impression');
  }
}
```

## Dépannage

### Problème: Preview floue ou de mauvaise qualité

**Solution:** Augmenter la résolution du produit ou du design:

```typescript
const processedDesign = await sharp(designBuffer)
  .resize(designWidthPx * 2, designHeightPx * 2) // 2x pour meilleure qualité
  .png({ quality: 100 })
  .toBuffer();
```

### Problème: Design mal positionné

**Vérifier:**
1. Le format de `position` dans `ProductDesignPosition`
2. Les dimensions du produit de base
3. Les pourcentages de position (0-100)

### Problème: Upload Cloudinary échoue

**Vérifier:**
1. La configuration Cloudinary
2. La taille du buffer (< limite Cloudinary)
3. Les credentials API

## Tests

```typescript
describe('ProductPreviewGeneratorService', () => {
  it('should generate preview with correct dimensions', async () => {
    const config = {
      productImageUrl: 'https://...',
      designImageUrl: 'https://...',
      position: { x: 25, y: 25, width: 30, height: 30 }
    };

    const preview = await service.generateProductPreview(config);
    expect(preview).toBeDefined();
    expect(preview.length).toBeGreaterThan(0);
  });
});
```

## Conclusion

Ce système permet de générer automatiquement des images de preview réalistes montrant exactement comment le produit final apparaîtra avec le design du vendeur. Il s'intègre parfaitement avec votre système existant de positionnement de design.
