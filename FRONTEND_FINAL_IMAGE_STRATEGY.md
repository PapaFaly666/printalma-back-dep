# Stratégie de Positionnement et Dimensionnement - Guide Frontend

## 🎯 Vue d'ensemble

Le backend génère automatiquement une image finale (`finalImageUrl`) qui combine le mockup produit avec le design positionné exactement comme dans la preview du frontend. Ce document explique **exactement** comment le positionnement et le dimensionnement fonctionnent.

---

## 📐 Système de Coordonnées - Concepts Clés

### 1. La Délimitation (Zone Imprimable)

La **délimitation** définit la zone imprimable sur le produit. C'est un rectangle défini par :

```typescript
interface Delimitation {
  x: number;           // Position X (% ou pixels)
  y: number;           // Position Y (% ou pixels)
  width: number;       // Largeur (% ou pixels)
  height: number;      // Hauteur (% ou pixels)
  coordinateType: 'PERCENTAGE' | 'PIXEL';
}
```

**Exemple** : Pour un t-shirt de 1200×1200px :
```json
{
  "x": 30,        // 30% depuis la gauche = 360px
  "y": 20,        // 20% depuis le haut = 240px
  "width": 40,    // 40% de largeur = 480px
  "height": 50,   // 50% de hauteur = 600px
  "coordinateType": "PERCENTAGE"
}
```

**Visualisation** :
```
┌─────────────────────────────────────────┐
│          Mockup 1200×1200px             │
│                                         │
│          ┌─────────────────┐            │
│          │   Délimitation  │            │
│          │   480×600px     │            │
│          │                 │            │
│          │  Zone imprimable│            │
│          └─────────────────┘            │
│                                         │
└─────────────────────────────────────────┘
```

---

### 2. Le Scale (Échelle du Design)

Le `scale` détermine quelle proportion de la délimitation le design va occuper.

```typescript
interface DesignPosition {
  scale: number;  // 0.8 = design occupe 80% de la délimitation
  x: number;      // Offset horizontal depuis le centre
  y: number;      // Offset vertical depuis le centre
  rotation?: number;  // Rotation en degrés
  positionUnit?: 'PIXEL' | 'PERCENTAGE';
}
```

**Calcul des dimensions du conteneur** :
```javascript
containerWidth = delimitation.width × scale
containerHeight = delimitation.height × scale
```

**Exemple** : Avec `scale = 0.8` et délimitation 480×600px :
```javascript
containerWidth = 480 × 0.8 = 384px
containerHeight = 600 × 0.8 = 480px
```

---

### 3. Positionnement Relatif au Centre

Les coordonnées `x` et `y` dans `DesignPosition` représentent un **décalage depuis le centre de la délimitation**, pas depuis le coin supérieur gauche !

**Formule de calcul de la position finale** :
```javascript
// 1. Calculer le centre de la délimitation
centerX = delimitation.x + (delimitation.width / 2)
centerY = delimitation.y + (delimitation.height / 2)

// 2. Calculer le centre du conteneur (avec offset)
containerCenterX = centerX + position.x
containerCenterY = centerY + position.y

// 3. Calculer le coin supérieur gauche du conteneur
containerLeft = containerCenterX - (containerWidth / 2)
containerTop = containerCenterY - (containerHeight / 2)
```

**Exemple visuel** :
```
position.x = 0, position.y = 0  →  Design centré dans la délimitation
position.x = 50, position.y = 0  →  Design décalé de 50px vers la droite
position.x = 0, position.y = -30 →  Design décalé de 30px vers le haut
```

---

## 🔄 Algorithme Complet de Génération

Voici l'algorithme exact utilisé par le backend (identique au frontend) :

### ÉTAPE 1 : Convertir la Délimitation en Pixels

Si la délimitation est en PERCENTAGE :
```javascript
delimInPixels = {
  x: (delim.x / 100) × imageWidth,
  y: (delim.y / 100) × imageHeight,
  width: (delim.width / 100) × imageWidth,
  height: (delim.height / 100) × imageHeight
}
```

### ÉTAPE 2 : Calculer les Dimensions du Conteneur

```javascript
containerWidth = delimInPixels.width × position.scale
containerHeight = delimInPixels.height × position.scale
```

### ÉTAPE 3 : Convertir les Offsets (si en pourcentage)

Si `positionUnit === 'PERCENTAGE'` :
```javascript
x = (position.x / 100) × delimInPixels.width
y = (position.y / 100) × delimInPixels.height
```

Sinon, utiliser directement `position.x` et `position.y` en pixels.

### ÉTAPE 4 : Appliquer les Contraintes

Le design ne doit pas dépasser de la délimitation :
```javascript
maxX = (delimInPixels.width - containerWidth) / 2
minX = -(delimInPixels.width - containerWidth) / 2
maxY = (delimInPixels.height - containerHeight) / 2
minY = -(delimInPixels.height - containerHeight) / 2

adjustedX = Math.max(minX, Math.min(x, maxX))
adjustedY = Math.max(minY, Math.min(y, maxY))
```

### ÉTAPE 5 : Calculer la Position Finale du Conteneur

```javascript
// Centre de la délimitation
delimCenterX = delimInPixels.x + (delimInPixels.width / 2)
delimCenterY = delimInPixels.y + (delimInPixels.height / 2)

// Centre du conteneur
containerCenterX = delimCenterX + adjustedX
containerCenterY = delimCenterY + adjustedY

// Coin supérieur gauche du conteneur
containerLeft = containerCenterX - (containerWidth / 2)
containerTop = containerCenterY - (containerHeight / 2)
```

### ÉTAPE 6 : Redimensionner le Design

Le design est redimensionné pour tenir dans le conteneur tout en préservant son aspect ratio (équivalent CSS `object-fit: contain`) :

```javascript
// Sharp (backend)
sharp(designBuffer).resize({
  width: containerWidth,
  height: containerHeight,
  fit: 'inside',  // ⚠️ Équivalent à object-fit: contain
  position: 'center'
})
```

Après le resize, le design peut être plus petit que le conteneur (si aspect ratio différent).

### ÉTAPE 7 : Calculer la Position de Collage du Design

```javascript
// Position pour coller le design centré dans le conteneur
designPasteLeft = containerCenterX - (resizedDesignWidth / 2)
designPasteTop = containerCenterY - (resizedDesignHeight / 2)
```

### ÉTAPE 8 : Appliquer la Rotation (optionnel)

Si `rotation !== 0` :
```javascript
rotatedDesign = sharp(design).rotate(rotation, {
  background: { r: 0, g: 0, b: 0, alpha: 0 }
})

// Recalculer la position pour garder le centre au même endroit
finalPasteLeft = containerCenterX - (rotatedDesignWidth / 2)
finalPasteTop = containerCenterY - (rotatedDesignHeight / 2)
```

### ÉTAPE 9 : Composer sur le Mockup

```javascript
finalImage = sharp(productBuffer).composite([
  {
    input: processedDesign,
    left: finalPasteLeft,
    top: finalPasteTop,
    blend: 'over'
  }
])
```

---

## 📊 Exemple Complet avec Calculs

### Données d'entrée

```json
{
  "mockup": {
    "width": 1200,
    "height": 1200
  },
  "delimitation": {
    "x": 30,  // PERCENTAGE
    "y": 20,
    "width": 40,
    "height": 50,
    "coordinateType": "PERCENTAGE"
  },
  "position": {
    "x": 50,  // 50px vers la droite
    "y": -30, // 30px vers le haut
    "scale": 0.8,
    "rotation": 0,
    "positionUnit": "PIXEL"
  },
  "design": {
    "width": 800,
    "height": 600
  }
}
```

### Calculs Étape par Étape

```javascript
// 1. Délimitation en pixels
delimInPixels = {
  x: (30/100) × 1200 = 360px,
  y: (20/100) × 1200 = 240px,
  width: (40/100) × 1200 = 480px,
  height: (50/100) × 1200 = 600px
}

// 2. Dimensions du conteneur
containerWidth = 480 × 0.8 = 384px
containerHeight = 600 × 0.8 = 480px

// 3. Offsets (déjà en pixels)
x = 50px
y = -30px

// 4. Contraintes
maxX = (480 - 384) / 2 = 48px
minX = -(480 - 384) / 2 = -48px
maxY = (600 - 480) / 2 = 60px
minY = -(600 - 480) / 2 = -60px

adjustedX = Math.max(-48, Math.min(50, 48)) = 48px  // Limité à 48px
adjustedY = Math.max(-60, Math.min(-30, 60)) = -30px // OK

// 5. Position du conteneur
delimCenterX = 360 + (480/2) = 600px
delimCenterY = 240 + (600/2) = 540px

containerCenterX = 600 + 48 = 648px
containerCenterY = 540 + (-30) = 510px

containerLeft = 648 - (384/2) = 456px
containerTop = 510 - (480/2) = 270px

// 6. Redimensionner le design (800×600 → fit dans 384×480)
// Aspect ratio: 800/600 = 1.33
// Pour tenir dans 384×480 avec aspect 1.33:
resizedDesignWidth = 384px  // Limité par la largeur
resizedDesignHeight = 384 / 1.33 = 288px

// 7. Position de collage du design
designPasteLeft = 648 - (384/2) = 456px
designPasteTop = 510 - (288/2) = 366px
```

### Résultat Final

```
┌───────────────────────────────────────────────────┐
│              Mockup 1200×1200px                   │
│                                                   │
│          ┌────────────────────┐                   │
│          │   Délimitation     │                   │
│          │   360,240          │                   │
│          │   480×600px        │                   │
│          │                    │                   │
│          │     ┌─────────┐    │ ← Design 384×288  │
│          │     │ Design  │    │   à (456, 366)    │
│          │     │ 384×288 │    │                   │
│          │     └─────────┘    │                   │
│          │                    │                   │
│          └────────────────────┘                   │
└───────────────────────────────────────────────────┘
```

---

## 🎨 Comparaison Frontend vs Backend

| Aspect | Frontend | Backend | Équivalence |
|--------|----------|---------|-------------|
| **Délimitation** | Rectangles définis dans Prisma | Même chose | ✅ Identique |
| **Scale** | `scale × delimitation` | `scale × delimitation` | ✅ Identique |
| **Position** | Offset depuis centre | Offset depuis centre | ✅ Identique |
| **Fit** | `object-fit: contain` | Sharp `fit: 'inside'` | ✅ Identique |
| **Rotation** | CSS `transform: rotate()` | Sharp `.rotate()` | ✅ Identique |
| **Contraintes** | `Math.max(min, Math.min(x, max))` | Même formule | ✅ Identique |

---

## 📦 Format des Données Attendues par le Backend

### Lors de la Création d'un Produit

```typescript
POST /vendor/publish
{
  "baseProductId": 5,
  "designId": 42,
  "designPosition": {
    "x": 0,              // Offset X (pixels ou %)
    "y": 0,              // Offset Y (pixels ou %)
    "scale": 0.8,        // 80% de la délimitation
    "rotation": 0,       // Rotation en degrés
    "positionUnit": "PIXEL"  // ou "PERCENTAGE"
  },
  // ... autres champs
}
```

### Réponse du Backend

```json
{
  "success": true,
  "productId": 123,
  "finalImageUrl": "https://res.cloudinary.com/.../final_123.png",
  "message": "Produit créé avec succès"
}
```

L'image `finalImageUrl` est générée automatiquement et montre le produit final avec le design positionné exactement comme dans votre preview frontend.

---

## 🔍 Points Importants pour le Frontend

### 1. Unités de Position

Deux options pour `x` et `y` dans `designPosition` :

**Option A : PIXEL** (recommandé pour cohérence)
```json
{
  "x": 50,     // 50 pixels vers la droite
  "y": -30,    // 30 pixels vers le haut
  "positionUnit": "PIXEL"
}
```

**Option B : PERCENTAGE** (relatif à la délimitation)
```json
{
  "x": 10,     // 10% de la largeur de la délimitation
  "y": -5,     // 5% de la hauteur de la délimitation (vers le haut)
  "positionUnit": "PERCENTAGE"
}
```

### 2. Délimitations

Les délimitations sont récupérées automatiquement depuis la base de données :
```
ColorVariation → ProductImage → Delimitations
```

Le backend utilise la **première délimitation** trouvée pour l'image du produit.

### 3. Aspect Ratio Préservé

Le design est TOUJOURS redimensionné en préservant son aspect ratio (comme `object-fit: contain`). Cela signifie :
- Si le design est carré et le conteneur rectangulaire, le design sera centré avec des espaces vides
- Si le design est rectangulaire et le conteneur carré, idem

### 4. Rotation

La rotation est appliquée **après** le redimensionnement et s'effectue autour du centre du design. La position est automatiquement ajustée pour garder le centre au même endroit.

### 5. Contraintes Automatiques

Le backend applique automatiquement les contraintes pour que le design ne dépasse JAMAIS de la délimitation. Si vous envoyez `x: 1000` mais que le max est `48`, le backend utilisera `48`.

---

## 🐛 Debug et Vérification

### Activer le Mode Debug

Pour voir visuellement la délimitation sur l'image générée (contour rouge en pointillés), le backend supporte un flag debug :

```typescript
// Dans le code backend
await previewGenerator.generatePreviewFromJson(
  productImageUrl,
  designImageUrl,
  delimitation,
  position,
  showDelimitation: true  // ⚠️ Active le tracé de la délimitation
)
```

Ceci trace un rectangle rouge autour de la délimitation avec des marqueurs aux coins.

### Logs à Surveiller

Le backend log chaque étape de la génération :
```
🎨 === DÉBUT GÉNÉRATION IMAGE FINALE ===
📐 Dimensions mockup: 1200×1200px
🎨 Dimensions design: 800×600px
📍 Délimitation en pixels: {"x":360,"y":240,"width":480,"height":600}
📦 Dimensions conteneur: 384×480px
📍 Position conteneur: centerX=648, centerY=510
🖼️ Dimensions après resize: 384×288px
📍 Position collage design: (456, 366)
✅ Image finale générée: 1200×1200px (245871 bytes)
```

### Vérifier la Cohérence

Pour vérifier que le backend génère la même chose que le frontend :

1. **Frontend** : Prendre une capture d'écran de votre preview
2. **Backend** : Créer le produit et télécharger `finalImageUrl`
3. **Comparer** : Les deux images doivent être **pixel-perfect** identiques

Si ce n'est pas le cas, vérifier :
- Les unités de position (`PIXEL` vs `PERCENTAGE`)
- La délimitation utilisée (la bonne image de produit ?)
- Les valeurs de `scale`, `x`, `y`

---

## 🚀 Workflow Complet

```
┌─────────────────────────────────────────────────┐
│              FRONTEND                           │
│                                                 │
│  1. User positionne le design sur le produit   │
│  2. Preview en temps réel (CSS transforms)     │
│  3. User clique "Publier"                      │
│                                                 │
│  4. Envoi à l'API:                             │
│     {                                          │
│       designPosition: {                        │
│         x: offsetX,                            │
│         y: offsetY,                            │
│         scale: 0.8,                            │
│         rotation: angle,                       │
│         positionUnit: "PIXEL"                  │
│       }                                        │
│     }                                          │
└─────────────────────────────────────────────────┘
                      │
                      │ POST /vendor/publish
                      ▼
┌─────────────────────────────────────────────────┐
│              BACKEND                            │
│                                                 │
│  1. Récupère délimitation depuis BDD           │
│  2. Calcule dimensions conteneur (scale)       │
│  3. Calcule position finale (centre + offset)  │
│  4. Redimensionne design (fit: inside)         │
│  5. Applique rotation si nécessaire            │
│  6. Compose sur le mockup                      │
│  7. Upload sur Cloudinary                      │
│  8. Sauvegarde finalImageUrl                   │
│                                                 │
│  Retourne:                                     │
│  {                                             │
│    finalImageUrl: "https://..."               │
│  }                                             │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         Image finale générée ✅                 │
│                                                 │
│  - Mockup + Design positionné                  │
│  - Identique à la preview frontend             │
│  - Prêt à afficher aux clients                 │
└─────────────────────────────────────────────────┘
```

---

## 📚 Références Techniques

### Fichiers Backend Concernés

- **Service de génération** : `src/vendor-product/services/product-preview-generator.service.ts`
- **Service de publication** : `src/vendor-product/vendor-publish.service.ts`
- **Schema Prisma** : `prisma/schema.prisma` (VendorProduct.finalImageUrl)
- **DTO** : `src/vendor-product/dto/vendor-publish.dto.ts`

### Documentation Associée

- `FINAL_IMAGE_WITH_DELIMITATIONS.md` : Implémentation détaillée des délimitations
- `FINAL_IMAGE_IMPLEMENTATION_SUMMARY.md` : Résumé de l'implémentation
- `PRODUCT_PREVIEW_GENERATION_GUIDE.md` : Guide complet de génération

---

## 💡 Conseils pour le Frontend

### 1. Utiliser les Mêmes Formules

Pour que votre preview soit identique au résultat backend, utilisez les **mêmes formules** :
```javascript
// Dimensions conteneur
const containerWidth = delimitation.width * scale
const containerHeight = delimitation.height * scale

// Centre délimitation
const centerX = delimitation.x + delimitation.width / 2
const centerY = delimitation.y + delimitation.height / 2

// Position conteneur
const containerLeft = centerX + offsetX - containerWidth / 2
const containerTop = centerY + offsetY - containerHeight / 2
```

### 2. Tester avec showDelimitation

Demandez au backend d'activer le mode debug pour voir la délimitation :
```
🔴 Rectangle rouge = délimitation
✅ Design doit être DANS ce rectangle
```

### 3. Valider les Contraintes

Avant d'envoyer au backend, appliquez les mêmes contraintes côté frontend :
```javascript
const maxX = (delimWidth - containerWidth) / 2
const minX = -(delimWidth - containerWidth) / 2
const adjustedX = Math.max(minX, Math.min(offsetX, maxX))
```

### 4. Gérer les Cas Limites

- **Design plus grand que la délimitation** : Scale automatiquement ajusté
- **Rotation importante** : Les dimensions changent, position recalculée
- **Aspect ratio différent** : Le design est centré dans le conteneur

---

## ✅ Checklist de Validation

Avant d'envoyer au backend, vérifier :

- [ ] Les délimitations existent pour le produit sélectionné
- [ ] `scale` est entre 0 et 1 (ex: 0.8 = 80%)
- [ ] `x` et `y` sont dans des limites raisonnables
- [ ] `positionUnit` est bien défini (`PIXEL` ou `PERCENTAGE`)
- [ ] `rotation` est entre 0 et 360 degrés
- [ ] La preview frontend montre bien ce qui est attendu

---

## 🎯 Résumé pour les Développeurs Frontend

**3 concepts clés à retenir** :

1. **Le scale s'applique à la délimitation, pas à l'image complète**
   ```
   containerWidth = delimitation.width × scale
   ```

2. **Les positions x,y sont des offsets depuis le CENTRE de la délimitation**
   ```
   containerCenter = delimitationCenter + offset
   ```

3. **Le design est redimensionné en préservant l'aspect ratio (object-fit: contain)**
   ```
   fit: 'inside' → Le design tient dans le conteneur, centré
   ```

**Le backend fait exactement la même chose que votre preview CSS !** 🎨

---

**Questions ?** Consultez les fichiers de documentation ou les logs backend pour plus de détails.
