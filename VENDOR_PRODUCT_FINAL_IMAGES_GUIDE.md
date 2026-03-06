# Guide de Génération des Images Finales pour Produits Vendeurs

## 📋 Vue d'ensemble

Le système génère automatiquement les **`finalImageUrl`** pour chaque couleur d'un produit vendeur, avec tous les éléments de design positionnés correctement (x, y, scale, rotation).

## 🔄 Flux automatique

### Lors de la création/publication d'un produit vendeur :

```
Vendeur publie produit via POST /vendor/products
    ↓
VendorPublishService.publishProduct()
    ├─→ Sauvegarde designPosition dans VendorDesignPosition
    ├─→ Récupère la position normalisée
    └─→ Lance imageGenerationQueue.generateImagesInBackground()
          ↓
          Pour chaque couleur:
          ├─→ ProductPreviewGeneratorService.generatePreviewFromJson()
          │   ├─→ Télécharge image produit
          │   ├─→ Télécharge image design
          │   ├─→ Calcule positions avec délimitation
          │   ├─→ Applique rotation, scale
          │   └─→ Compose image finale avec Sharp
          ├─→ CloudinaryService.uploadBuffer()
          └─→ Sauvegarde dans VendorProductImage.finalImageUrl
```

## 🎯 Composants clés

### 1. **ProductPreviewGeneratorService**
- **Localisation**: `src/vendor-product/services/product-preview-generator.service.ts`
- **Rôle**: Génère l'image finale avec design positionné
- **Méthode principale**: `generatePreviewFromJson()`
- **Entrées**:
  - `productImageUrl` - Image du produit de base (t-shirt, mug, etc.)
  - `designImageUrl` - Image du design du vendeur
  - `delimitation` - Zone imprimable (x, y, width, height)
  - `positionData` - Position du design (x, y, scale, rotation)

### 2. **ImageGenerationQueueService**
- **Localisation**: `src/vendor-product/services/image-generation-queue.service.ts`
- **Rôle**: Génère les images pour toutes les couleurs en parallèle
- **Méthode principale**: `generateImagesForColors()`
- **Fonctionnalités**:
  - ✅ Génération parallèle (2 couleurs max en même temps)
  - ✅ Retry automatique (3 tentatives par couleur)
  - ✅ Logging détaillé
  - ✅ Sauvegarde automatique en BD

### 3. **DesignPositionService**
- **Localisation**: `src/vendor-product/services/design-position.service.ts`
- **Rôle**: Gère la sauvegarde et récupération des positions de design
- **Table**: `VendorDesignPosition`

### 4. **VendorPublishService**
- **Localisation**: `src/vendor-product/vendor-publish.service.ts`
- **Rôle**: Orchestration de la publication et génération
- **Nouvelle méthode**: `regenerateFinalImages()`

## 📊 Structure des données

### Position du design (DesignPosition)
```typescript
{
  x: number,              // Offset X depuis le centre de la délimitation (pixels)
  y: number,              // Offset Y depuis le centre de la délimitation (pixels)
  scale: number,          // Échelle du design (0.8 = 80% de la délimitation)
  rotation: number,       // Rotation en degrés (0-360)
  delimitationWidth: number,   // Largeur de la délimitation en pixels
  delimitationHeight: number   // Hauteur de la délimitation en pixels
}
```

### Délimitation (Zone imprimable)
```typescript
{
  x: number,              // Position X sur l'image produit
  y: number,              // Position Y sur l'image produit
  width: number,          // Largeur de la zone
  height: number,         // Hauteur de la zone
  coordinateType: 'PERCENTAGE' | 'PIXEL'
}
```

### Image finale générée (VendorProductImage)
```typescript
{
  vendorProductId: number,
  colorId: number,
  colorName: string,
  colorCode: string,
  imageType: 'final',           // Type d'image
  cloudinaryUrl: string,         // Image produit de base
  cloudinaryPublicId: string,
  finalImageUrl: string,         // ✨ IMAGE FINALE GÉNÉRÉE
  finalImagePublicId: string,
  width: number,
  height: number
}
```

## 🛠️ API Endpoints

### 1. Vérifier le statut de génération

**GET** `/vendor/products/:id/images-status`

```bash
curl http://localhost:3004/vendor/products/123/images-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse:**
```json
{
  "success": true,
  "productId": 123,
  "imagesGeneration": {
    "totalExpected": 5,
    "totalGenerated": 5,
    "percentage": 100,
    "allGenerated": true
  },
  "finalImages": [
    {
      "colorId": 1,
      "colorName": "Noir",
      "finalImageUrl": "https://res.cloudinary.com/..."
    }
  ]
}
```

### 2. Régénérer les images finales

**POST** `/vendor/products/:id/regenerate-final-images`

```bash
curl -X POST http://localhost:3004/vendor/products/123/regenerate-final-images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse:**
```json
{
  "success": true,
  "message": "Images finales régénérées avec succès",
  "productId": 123,
  "result": {
    "totalColors": 5,
    "colorsProcessed": 5,
    "colorsRemaining": 0,
    "totalGenerationTime": 45000,
    "averageTimePerColor": 9000,
    "generatedImages": [
      {
        "colorId": 1,
        "url": "https://res.cloudinary.com/..."
      }
    ]
  }
}
```

## 🧪 Testing

### Script de test fourni

```bash
./test-regenerate-vendor-images.sh <VENDOR_PRODUCT_ID> <JWT_TOKEN>
```

**Exemple:**
```bash
./test-regenerate-vendor-images.sh 123 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Obtenir le JWT Token

1. Connectez-vous sur le frontend
2. Ouvrez la console du navigateur (F12)
3. Tapez: `localStorage.getItem('token')`
4. Copiez le token

### Workflow de test complet

```bash
# 1. Vérifier le statut actuel
curl http://localhost:3004/vendor/products/123/images-status \
  -H "Authorization: Bearer $TOKEN"

# 2. Régénérer les images si nécessaire
curl -X POST http://localhost:3004/vendor/products/123/regenerate-final-images \
  -H "Authorization: Bearer $TOKEN"

# 3. Vérifier que toutes les images sont générées
curl http://localhost:3004/vendor/products/123/images-status \
  -H "Authorization: Bearer $TOKEN"
```

## 🔍 Debugging

### Logs détaillés

Le système génère des logs détaillés pour chaque étape:

```
🚀 [PARALLEL] Début génération parallèle pour produit 123
📊 [PARALLEL] 5 couleurs à traiter
⚡ [PARALLEL] Concurrency max: 2
🔄 [PARALLEL] Max retries: 3 par couleur

🎨 [PARALLEL] Couleur 1/5: Noir (Tentative 1/3)
📎 [PARALLEL] URL image de base pour Noir: https://...
📐 [PARALLEL] Délimitation pour Noir: {"x":100,"y":150,"width":400,"height":500}
🖼️ [PARALLEL] Génération preview pour Noir...
✅ [PARALLEL] Image générée pour Noir (250000 bytes)
☁️ [PARALLEL] Upload vers Cloudinary pour Noir...
☁️ [PARALLEL] Upload terminé pour Noir: https://res.cloudinary.com/...
💾 [PARALLEL] Sauvegardé en BDD pour Noir
```

### Erreurs courantes

#### 1. Aucune position de design trouvée
```
❌ Aucune position de design trouvée pour le produit 123
```
**Solution**: S'assurer que `designPosition` est fourni lors de la publication

#### 2. Images non générées en arrière-plan
```
⚠️ Aucune position de design fournie - génération d'images skipée
```
**Solution**: Vérifier que `publishDto.designPosition` contient les données correctes

#### 3. Timeout lors de la génération
```
❌ [PARALLEL] Erreur tentative 1/3 pour Rouge: timeout
```
**Solution**: Le système retry automatiquement (3 tentatives)

## 📈 Performances

### Temps de génération

- **Par couleur**: ~8-15 secondes
- **5 couleurs**: ~45-75 secondes (en parallèle, max 2 à la fois)
- **10 couleurs**: ~90-150 secondes

### Optimisations

1. **Génération asynchrone**: Les images sont générées en arrière-plan
2. **Parallélisation**: Max 2 couleurs en même temps
3. **Retry automatique**: 3 tentatives par couleur
4. **Upload optimisé**: Buffer direct vers Cloudinary

## 🔧 Configuration

### Variables d'environnement requises

```env
# Cloudinary (obligatoire)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Paramètres de génération

Dans `image-generation-queue.service.ts`:

```typescript
private readonly MAX_RETRIES = 3;                // Tentatives max par couleur
private readonly RETRY_DELAY = 2000;             // 2s entre les retry
private readonly MAX_CONCURRENT_GENERATIONS = 2; // Max 2 images en parallèle
```

## 📚 Fichiers modifiés

### Nouveaux fichiers
- ✅ `test-regenerate-vendor-images.sh` - Script de test
- ✅ `VENDOR_PRODUCT_FINAL_IMAGES_GUIDE.md` - Cette documentation

### Fichiers modifiés
- ✅ `vendor-publish.controller.ts:775-790` - Nouvel endpoint de régénération
- ✅ `vendor-publish.service.ts:3812-3895` - Méthode `regenerateFinalImages()`

### Fichiers existants (non modifiés)
- `product-preview-generator.service.ts` - Génération de mockups
- `image-generation-queue.service.ts` - Queue de génération parallèle
- `design-position.service.ts` - Gestion des positions

## 🎯 Résumé

Le système de génération de `finalImageUrl` est **déjà complet et fonctionnel**:

✅ Génération automatique lors de la publication
✅ Support des positions (x, y, scale, rotation)
✅ Génération parallèle pour toutes les couleurs
✅ Retry automatique en cas d'erreur
✅ Sauvegarde dans `VendorProductImage.finalImageUrl`
✅ Endpoint de vérification du statut
✅ **NOUVEAU**: Endpoint de régénération manuelle
✅ **NOUVEAU**: Script de test

## 💡 Utilisation pratique

### Pour un vendeur qui publie un produit:

1. Le vendeur personnalise son design (position, rotation, taille)
2. Il publie le produit via POST /vendor/products
3. **Les images sont générées automatiquement en arrière-plan**
4. Le vendeur peut vérifier le statut avec GET /vendor/products/:id/images-status
5. Les `finalImageUrl` sont disponibles pour affichage sur le frontend

### Pour régénérer manuellement:

```bash
./test-regenerate-vendor-images.sh <PRODUCT_ID> <JWT_TOKEN>
```

---

**Date**: 2026-03-03
**Version**: 1.0.0
**Auteur**: Claude Code
