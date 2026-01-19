# Génération d'Image Finale avec Délimitations - Implémentation Backend

## 🎯 Objectif

Implémenter le système de génération d'image finale côté backend en respectant **exactement la même logique que le frontend** :
- Le design est positionné **DANS la délimitation** (zone imprimable)
- Les coordonnées x,y sont des **offsets relatifs au centre de la délimitation**
- Le scale est un pourcentage de la taille de la délimitation (0.8 = 80%)

## ✅ Ce qui a été corrigé

### 1. ProductPreviewGeneratorService - Logique Frontend Implémentée

**Fichier** : `src/vendor-product/services/product-preview-generator.service.ts`

#### Nouvelles interfaces

```typescript
interface Delimitation {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
}

interface DesignPosition {
  x: number;              // Offset X depuis le centre de la délimitation
  y: number;              // Offset Y depuis le centre de la délimitation
  scale: number;          // Échelle (0.8 = 80% de la délimitation)
  rotation?: number;      // Rotation en degrés
  designWidth?: number;
  designHeight?: number;
}
```

#### Méthodes ajoutées (comme le frontend)

1. **`convertDelimitationToPixels()`**
   - Convertit la délimitation en pixels (si en pourcentage)
   - Correspond à la logique du frontend

2. **`calculateDesignDimensions()`**
   - Calcule les dimensions du design en respectant l'aspect ratio
   - Le design occupe `scale * 100%` de la délimitation

3. **`calculateFinalDesignPosition()`**
   - **Position finale = Centre délimitation + Offset - (Dimensions / 2)**
   - Respecte le système de coordonnées relatif au centre

4. **`applyConstraints()`**
   - S'assure que le design reste dans les limites de la délimitation

### 2. VendorPublishService - Récupération des Délimitations

**Fichier** : `src/vendor-product/vendor-publish.service.ts`

**Changements clés** :

```typescript
// ❌ AVANT : Pas de délimitations
const colorVariation = await this.prisma.colorVariation.findFirst({
  include: {
    images: { take: 1 }
  }
});

// ✅ APRÈS : Récupération des délimitations
const colorVariation = await this.prisma.colorVariation.findFirst({
  include: {
    images: {
      include: {
        delimitations: true,  // IMPORTANT !
      },
      take: 1
    }
  }
});

// Extraire la première délimitation
const delimitation = productImage.delimitations?.[0];

// Générer l'image avec la délimitation
const finalImageBuffer = await this.previewGenerator.generatePreviewFromJson(
  productImage.url,
  design.imageUrl,
  delimitationData,  // ✅ Délimitation passée
  positionData
);
```

## 🔑 Algorithme Implémenté (Identique au Frontend)

### Étape 1 : Convertir la délimitation en pixels

```typescript
delimInPixels = {
  x: (delim.x / 100) * imageWidth,
  y: (delim.y / 100) * imageHeight,
  width: (delim.width / 100) * imageWidth,
  height: (delim.height / 100) * imageHeight
}
```

### Étape 2 : Calculer les dimensions du design

```typescript
// Design = scale * taille de la délimitation
designWidth = delimInPixels.width * scale
designHeight = designWidth / aspectRatio  // Respect aspect ratio
```

### Étape 3 : Calculer la position (CLÉE !)

```typescript
// Centre de la délimitation
centerX = delimInPixels.x + (delimInPixels.width / 2)
centerY = delimInPixels.y + (delimInPixels.height / 2)

// Position finale = Centre + Offset - (Dimensions / 2)
finalX = centerX + position.x - (designWidth / 2)
finalY = centerY + position.y - (designHeight / 2)
```

### Étape 4 : Appliquer les contraintes

```typescript
// Le design ne doit JAMAIS dépasser de la délimitation
clampedX = Math.max(minX, Math.min(finalX, maxX))
clampedY = Math.max(minY, Math.min(finalY, maxY))
```

## 📐 Exemple Concret

### Données d'entrée

```json
{
  "productImage": {
    "width": 1200,
    "height": 1200,
    "url": "https://.../ product.jpg"
  },
  "delimitation": {
    "x": 30,           // 30% depuis la gauche
    "y": 20,           // 20% depuis le haut
    "width": 40,       // 40% de largeur
    "height": 50,      // 50% de hauteur
    "coordinateType": "PERCENTAGE"
  },
  "designPosition": {
    "x": 0,            // Centré horizontalement
    "y": 0,            // Centré verticalement
    "scale": 0.8,      // 80% de la délimitation
    "rotation": 0
  },
  "design": {
    "width": 500,
    "height": 500,
    "url": "https://.../design.png"
  }
}
```

### Calculs

```javascript
// 1. Délimitation en pixels
delimInPixels = {
  x: (30/100) * 1200 = 360px,
  y: (20/100) * 1200 = 240px,
  width: (40/100) * 1200 = 480px,
  height: (50/100) * 1200 = 600px
}

// 2. Centre de la délimitation
centerX = 360 + (480/2) = 600px
centerY = 240 + (600/2) = 540px

// 3. Dimensions du design
designWidth = 480 * 0.8 = 384px
designHeight = 384 / (500/500) = 384px  // Aspect ratio = 1

// 4. Position finale
finalX = 600 + 0 - (384/2) = 408px
finalY = 540 + 0 - (384/2) = 348px
```

### Résultat

```json
{
  "x": 408,
  "y": 348,
  "width": 384,
  "height": 384
}
```

Le design de 384x384px est positionné à (408, 348) **dans la zone imprimable**.

## 🎨 Flux Complet

```
1. Vendeur crée un produit
   └─> Body: { designPosition: { x: 0, y: 0, scale: 0.8 }, ... }

2. Backend récupère les données
   ├─> Image du produit (via ColorVariation)
   ├─> Délimitations de l'image (via ProductImage.delimitations)
   └─> Position du design (designPosition)

3. ProductPreviewGeneratorService
   ├─> Convertit délimitation en pixels
   ├─> Calcule dimensions du design (scale * délimitation)
   ├─> Calcule position finale (centre + offset)
   ├─> Applique contraintes
   ├─> Redimensionne le design
   ├─> Applique rotation
   └─> Compose sur l'image du produit

4. Upload Cloudinary
   └─> Sauvegarde dans VendorProduct.finalImageUrl
```

## ✅ Validation

### Points vérifiés

- [x] Délimitations récupérées depuis la base de données
- [x] Conversion PERCENTAGE → PIXEL
- [x] Calcul du centre de la délimitation
- [x] Position relative au centre (pas absolue)
- [x] Respect de l'aspect ratio du design
- [x] Application des contraintes
- [x] Rotation supportée
- [x] Génération automatique lors de la création du produit

### Logs à surveiller

```
🎨 Génération image finale pour produit 123...
📍 Délimitation trouvée: {"x":30,"y":20,"width":40,"height":50}
📐 Dimensions produit: 1200x1200px
📐 Dimensions design: 500x500px
📐 Délimitation en pixels: {"x":360,"y":240,"width":480,"height":600}
📏 Dimensions design calculées: 384x384px
📍 Position finale: (408, 348)
✅ Image finale générée (125487 bytes)
☁️ Image finale uploadée: https://...
💾 Image finale sauvegardée dans VendorProduct 123
```

## 🚀 Test

### Créer un produit

```bash
POST /vendor/publish
Content-Type: application/json
Authorization: Bearer {token}

{
  "baseProductId": 5,
  "designId": 42,
  "vendorName": "Mon T-shirt",
  "vendorPrice": 15000,
  "designPosition": {
    "x": 0,        // Centré
    "y": 0,        // Centré
    "scale": 0.8,  // 80% de la délimitation
    "rotation": 0
  },
  "selectedColors": [...],
  "selectedSizes": [...],
  "productStructure": {...}
}
```

### Réponse

```json
{
  "success": true,
  "productId": 123,
  "finalImageUrl": "https://res.cloudinary.com/.../final_123.png"
}
```

### Vérifier l'image

L'image finale doit montrer le design **positionné exactement dans la zone imprimable** définie par la délimitation, avec la même apparence que le preview du frontend.

## 📊 Comparaison Frontend vs Backend

| Aspect | Frontend | Backend | Status |
|--------|----------|---------|--------|
| Position relative au centre | ✅ | ✅ | ✅ Identique |
| Scale en % de la délimitation | ✅ | ✅ | ✅ Identique |
| Respect aspect ratio | ✅ | ✅ | ✅ Identique |
| Contraintes | ✅ | ✅ | ✅ Identique |
| Rotation | ✅ | ✅ | ✅ Identique |
| Support PERCENTAGE/PIXEL | ✅ | ✅ | ✅ Identique |

## 🎯 Conclusion

Le backend implémente maintenant **exactement la même logique que le frontend** pour positionner les designs :
- ✅ Utilisation des délimitations
- ✅ Position relative au centre
- ✅ Scale proportionnel
- ✅ Contraintes appliquées
- ✅ Génération automatique

L'image finale générée par le backend sera **pixel-perfect** avec le preview du frontend.

---

**Version** : 2.0.0 (Avec délimitations)
**Date** : 14 janvier 2026
