# Guide d'Implémentation - Bounding Box pour Positionnement Pixel-Perfect

**Date:** 18 janvier 2026
**Version:** 1.0
**Statut:** ✅ Implémenté côté backend

---

## 🎯 Objectif

Garantir un positionnement **pixel-perfect** du design sur le produit en envoyant explicitement les dimensions du conteneur (bounding box) du frontend au backend.

---

## ✅ Ce qui a été implémenté côté Backend

### 1. Interface DesignPosition mise à jour

```typescript
interface DesignPosition {
  x: number;              // Offset X depuis le centre
  y: number;              // Offset Y depuis le centre
  scale: number;          // Échelle (0.8 = 80%)
  rotation?: number;      // Rotation en degrés
  designWidth?: number;   // Largeur originale du design
  designHeight?: number;  // Hauteur originale du design
  positionUnit?: 'PIXEL' | 'PERCENTAGE';

  // 🎯 NOUVEAU - Bounding Box
  containerWidth?: number;  // Largeur du conteneur en pixels
  containerHeight?: number; // Hauteur du conteneur en pixels
}
```

**Fichier:** `src/vendor-product/services/product-preview-generator.service.ts:13-25`

### 2. Logique de génération modifiée

Le service `ProductPreviewGeneratorService` utilise maintenant les valeurs du bounding box en priorité :

```typescript
// ✅ Si le frontend envoie containerWidth et containerHeight
if (position.containerWidth && position.containerHeight) {
  containerWidth = position.containerWidth;   // Utiliser directement
  containerHeight = position.containerHeight; // Pas de recalcul !

  // Validation optionnelle (logs de debug)
  const expectedWidth = delimInPixels.width × scale;
  const expectedHeight = delimInPixels.height × scale;

  if (Math.abs(containerWidth - expectedWidth) > 1) {
    logger.warn('Bounding box mismatch, utilisation des valeurs frontend');
  }
}
// ⚠️ Sinon, fallback sur le calcul classique
else {
  containerWidth = delimInPixels.width × scale;
  containerHeight = delimInPixels.height × scale;
  logger.warn('Bounding box non fourni, recalcul');
}
```

**Fichier:** `src/vendor-product/services/product-preview-generator.service.ts:273-304`

---

## 📦 Format des Données Attendues

### Requête POST /vendor/publish

```typescript
{
  "baseProductId": 5,
  "designId": 42,
  "vendorName": "Mon T-shirt",
  "vendorPrice": 15000,

  "designPosition": {
    // Positionnement
    "x": 50,                    // Offset horizontal (pixels)
    "y": -30,                   // Offset vertical (pixels)
    "scale": 0.8,               // 80% de la délimitation
    "rotation": 0,              // Rotation en degrés
    "positionUnit": "PIXEL",    // ou "PERCENTAGE"

    // Dimensions du design
    "designWidth": 800,         // Largeur originale
    "designHeight": 600,        // Hauteur originale

    // 🎯 BOUNDING BOX - NOUVEAU !
    "containerWidth": 384,      // = delimitation.width × scale
    "containerHeight": 480      // = delimitation.height × scale
  },

  // ... autres champs
}
```

---

## 🔧 Comment le Frontend doit Calculer le Bounding Box

### Étape 1 : Récupérer la délimitation

```typescript
// La délimitation peut être en PERCENTAGE ou PIXEL
const delimitation = productImage.delimitations[0];

// Dimensions de l'image affichée
const imageWidth = productImage.width;   // ex: 1200px
const imageHeight = productImage.height; // ex: 1200px
```

### Étape 2 : Convertir en pixels si nécessaire

```typescript
const delimInPixels = {
  x: delimitation.coordinateType === 'PIXEL'
    ? delimitation.x
    : (delimitation.x / 100) * imageWidth,

  y: delimitation.coordinateType === 'PIXEL'
    ? delimitation.y
    : (delimitation.y / 100) * imageHeight,

  width: delimitation.coordinateType === 'PIXEL'
    ? delimitation.width
    : (delimitation.width / 100) * imageWidth,

  height: delimitation.coordinateType === 'PIXEL'
    ? delimitation.height
    : (delimitation.height / 100) * imageHeight
};

// Exemple : délimitation 30%, 20%, 40%, 50% sur image 1200×1200
// → delimInPixels = { x: 360, y: 240, width: 480, height: 600 }
```

### Étape 3 : Calculer le bounding box

```typescript
const scale = 0.8; // 80% de la délimitation

const containerWidth = delimInPixels.width * scale;
const containerHeight = delimInPixels.height * scale;

// Exemple : 480 × 0.8 = 384px, 600 × 0.8 = 480px
```

### Étape 4 : Construire l'objet designPosition

```typescript
const designPosition = {
  x: offsetX,              // Calculé par votre logique de drag
  y: offsetY,              // Calculé par votre logique de drag
  scale: scale,
  rotation: rotationAngle,
  positionUnit: 'PIXEL',

  designWidth: design.width,
  designHeight: design.height,

  // 🎯 Bounding box calculé
  containerWidth: Math.round(containerWidth),
  containerHeight: Math.round(containerHeight)
};
```

### Étape 5 : Envoyer au backend

```typescript
const response = await fetch('/api/vendor/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    baseProductId,
    designId,
    designPosition,
    // ... autres champs
  })
});
```

---

## 📊 Exemple Complet

### Contexte

- Image produit : 1200×1200px
- Délimitation : `{ x: 30%, y: 20%, width: 40%, height: 50% }` (PERCENTAGE)
- Scale : 0.8 (80%)
- Design original : 800×600px
- Offset : x=50px, y=-30px

### Calculs Frontend

```javascript
// 1. Délimitation en pixels
const delimInPixels = {
  x: (30 / 100) * 1200 = 360px,
  y: (20 / 100) * 1200 = 240px,
  width: (40 / 100) * 1200 = 480px,
  height: (50 / 100) * 1200 = 600px
};

// 2. Bounding box
const containerWidth = 480 * 0.8 = 384px;
const containerHeight = 600 * 0.8 = 480px;

// 3. Objet à envoyer
const designPosition = {
  x: 50,
  y: -30,
  scale: 0.8,
  rotation: 0,
  positionUnit: 'PIXEL',
  designWidth: 800,
  designHeight: 600,
  containerWidth: 384,   // ✅
  containerHeight: 480   // ✅
};
```

### Logs Backend (après envoi)

```
📦 Utilisation du bounding box du frontend: 384x480px
✅ Validation OK (différence: 0px)
```

Si le bounding box ne correspond pas au calcul backend :

```
⚠️ Bounding box mismatch détecté:
   Reçu: 384x480px
   Attendu: 385x481px
   Différence: 1.00px × 1.00px
   → Utilisation des valeurs du frontend (source de vérité)
```

---

## 🎨 Avantages de cette Approche

### ✅ Pixel-Perfect

Le backend utilise **exactement** les mêmes dimensions que celles affichées au frontend.

### ✅ Pas d'Ambiguïté

Plus de risque d'utiliser la mauvaise délimitation ou de faire des conversions incorrectes.

### ✅ Rétrocompatibilité

Si le frontend n'envoie pas `containerWidth` et `containerHeight`, le backend recalcule automatiquement (fallback).

### ✅ Validation Automatique

Le backend compare les valeurs reçues avec ce qu'il aurait calculé et log les différences (utile pour déboguer).

---

## 🐛 Debug et Validation

### Activer les Logs Détaillés

Les logs backend affichent maintenant :

```
🎨 === DÉBUT GÉNÉRATION IMAGE FINALE ===
📐 Dimensions mockup: 1200x1200px
🎨 Dimensions design: 800x600px
📍 Délimitation en pixels: {"x":360,"y":240,"width":480,"height":600}
📦 Utilisation du bounding box du frontend: 384x480px
✅ Validation OK
📍 Centre délimitation: (600, 540)
📍 Position conteneur: centerX=650, centerY=510
🖼️ Dimensions après resize: 384×288px
📍 Position collage design: (458, 366)
✅ Image finale générée: 1200×1200px
```

### Vérifier la Cohérence

```typescript
// Frontend (dans la console)
console.log('📦 Bounding box envoyé:', {
  containerWidth,
  containerHeight,
  scale,
  delimInPixels
});

// Backend (dans les logs)
// Vérifier que les valeurs correspondent
```

### Tester le Rendu

1. Créer un produit avec le frontend
2. Télécharger l'image `finalImageUrl` générée
3. Comparer avec la preview frontend
4. Les deux doivent être **identiques pixel par pixel**

---

## ⚠️ Points d'Attention

### 1. Arrondir les Valeurs

Les calculs peuvent produire des décimales. Le frontend doit arrondir avant d'envoyer :

```typescript
containerWidth: Math.round(delimInPixels.width * scale)
containerHeight: Math.round(delimInPixels.height * scale)
```

### 2. Gestion du Cache

Si vous utilisez le localStorage pour sauvegarder `designPosition`, assurez-vous d'inclure les nouvelles propriétés :

```typescript
localStorage.setItem('designPosition', JSON.stringify({
  x, y, scale, rotation, positionUnit,
  designWidth, designHeight,
  containerWidth, containerHeight  // ✅ Ne pas oublier !
}));
```

### 3. Validation Frontend

Avant d'envoyer, vérifier que les valeurs sont valides :

```typescript
if (!containerWidth || !containerHeight || containerWidth <= 0 || containerHeight <= 0) {
  console.error('❌ Bounding box invalide:', { containerWidth, containerHeight });
  // Ne pas envoyer ou recalculer
}
```

### 4. Images de Tailles Différentes

Si votre frontend affiche des images à des tailles différentes de l'original (ex: thumbnails), assurez-vous de calculer le bounding box sur la **taille réelle** de l'image de production, pas sur la taille affichée.

```typescript
// ❌ Mauvais (si l'image est redimensionnée à l'affichage)
const displayedWidth = imgElement.clientWidth; // ex: 400px
const containerWidth = (delim.width / 100) * displayedWidth * scale;

// ✅ Bon (utiliser la taille réelle)
const actualWidth = productImage.width; // ex: 1200px
const containerWidth = (delim.width / 100) * actualWidth * scale;
```

---

## 🧪 Tests Recommandés

### Test 1 : Valeurs Envoyées

```typescript
// Intercepter la requête avant envoi
console.log('📤 Envoi au backend:', designPosition);

// Vérifier que containerWidth et containerHeight sont présents
expect(designPosition.containerWidth).toBeDefined();
expect(designPosition.containerHeight).toBeDefined();
expect(designPosition.containerWidth).toBeGreaterThan(0);
expect(designPosition.containerHeight).toBeGreaterThan(0);
```

### Test 2 : Cohérence Backend

```typescript
// Côté backend, dans les logs
const expected = {
  width: delimInPixels.width * scale,
  height: delimInPixels.height * scale
};

const diff = {
  width: Math.abs(containerWidth - expected.width),
  height: Math.abs(containerHeight - expected.height)
};

// Tolérance de 1px pour les arrondis
expect(diff.width).toBeLessThanOrEqual(1);
expect(diff.height).toBeLessThanOrEqual(1);
```

### Test 3 : Rendu Visuel

```typescript
// Comparer pixel par pixel
const frontendPreview = captureScreenshot(previewElement);
const backendImage = await fetch(finalImageUrl).then(r => r.blob());

const similarity = compareImages(frontendPreview, backendImage);
expect(similarity).toBeGreaterThan(0.99); // 99% de similarité minimum
```

---

## 📚 Fichiers Modifiés

### Backend

- ✅ `src/vendor-product/services/product-preview-generator.service.ts`
  - Interface `DesignPosition` mise à jour (lignes 13-25)
  - Logique `generateProductPreview` modifiée (lignes 273-304)

### Frontend (à faire)

- [ ] Calculer `containerWidth` et `containerHeight`
- [ ] Inclure dans l'objet `designPosition` envoyé au backend
- [ ] Mettre à jour le localStorage si utilisé
- [ ] Tester la cohérence avec le backend

---

## ✅ Checklist d'Implémentation Frontend

### Calcul du Bounding Box

- [ ] Récupérer la délimitation de l'image produit
- [ ] Convertir en pixels si nécessaire
- [ ] Calculer `containerWidth = delimInPixels.width × scale`
- [ ] Calculer `containerHeight = delimInPixels.height × scale`
- [ ] Arrondir les valeurs avec `Math.round()`

### Envoi au Backend

- [ ] Ajouter `containerWidth` à `designPosition`
- [ ] Ajouter `containerHeight` à `designPosition`
- [ ] Vérifier que les valeurs sont > 0
- [ ] Envoyer dans la requête POST /vendor/publish

### Validation

- [ ] Vérifier les logs backend (aucun warning de mismatch)
- [ ] Comparer la preview frontend avec `finalImageUrl`
- [ ] Tester avec différents produits et délimitations
- [ ] Tester avec différents scales (0.5, 0.8, 1.0)
- [ ] Tester avec rotation

---

## 🎯 Résultat Attendu

Après implémentation, chaque création de produit devrait afficher dans les logs backend :

```
✅ 📦 Utilisation du bounding box du frontend: 384x480px
✅ Validation OK (différence: 0px)
```

Et l'image `finalImageUrl` générée doit être **pixel-perfect identique** à la preview frontend.

---

## 🚀 Prochaines Étapes

1. **Frontend** : Implémenter le calcul et l'envoi du bounding box
2. **Test** : Créer plusieurs produits et vérifier la cohérence
3. **Validation** : Comparer visuellement les rendus
4. **Documentation** : Mettre à jour le guide frontend si nécessaire

---

## 💡 Astuce pour le Frontend

Si vous utilisez déjà `scale` et `delimitation` dans votre code de preview, le calcul du bounding box est très simple :

```typescript
// Vous avez déjà ces valeurs quelque part
const scale = 0.8;
const delimInPixels = { width: 480, height: 600 };

// Il suffit d'ajouter ces 2 lignes
const containerWidth = Math.round(delimInPixels.width * scale);
const containerHeight = Math.round(delimInPixels.height * scale);

// Et de les inclure dans l'objet envoyé
const designPosition = {
  ...existingFields,
  containerWidth,
  containerHeight
};
```

---

**Questions ?** Consultez les logs backend ou le fichier `FRONTEND_FINAL_IMAGE_STRATEGY.md` pour plus de détails sur le positionnement.

---

**Auteur:** Claude Sonnet 4.5
**Date:** 18 janvier 2026
**Statut:** ✅ Backend implémenté, Frontend à faire
