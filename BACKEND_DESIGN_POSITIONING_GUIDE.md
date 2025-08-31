# Guide Backend - Correction du Positionnement des Designs

## 🚨 Problème Identifié

Les APIs `/vendor/products` et `/public/new-arrivals` retournent des **formats de données incohérents** pour le positionnement des designs, causant des problèmes d'affichage dans le frontend.

## 📊 Analyse des Différences Actuelles

### API `/vendor/products` 
```json
{
  "designPositions": [{
    "position": {
      "x": -1.323659752186181,
      "y": 6.840766094438479,
      "scale": 0.85,
      "coordinateType": "PERCENTAGE"
    }
  }],
  "delimitations": [{
    "x": 451.99,
    "y": 379.15,
    "width": 302.96,
    "height": 612.21,
    "coordinateType": "PERCENTAGE"
  }]
}
```

### API `/public/new-arrivals` ❌ PROBLÉMATIQUE
```json
{
  "designPosition": {
    "x": 2,                    // ❌ Format différent
    "y": -44.87754680897572,   // ❌ Valeurs incohérentes
    "scale": 0.5411234048909667
  },
  "delimitations": [{
    "x": 378.9581298828125,     // ❌ Pixels absolus
    "y": 236.7476168252855,     // ❌ Sans coordinateType
    "width": 406.6666666666667,
    "height": 476.6666302998888
  }]
}
```

## ✅ Solution Requise

### 1. Standardiser le Format de Réponse

**Les deux APIs doivent retourner EXACTEMENT le même format :**

```json
{
  "designPositions": [{
    "designId": 9,
    "position": {
      "x": -1.323659752186181,    // ✅ Coordonnées cohérentes
      "y": 6.840766094438479,     // ✅ Même système de calcul
      "scale": 0.85,
      "rotation": 0,
      "constraints": {},
      "designWidth": 200,
      "designHeight": 200
    },
    "createdAt": "2025-08-29T10:59:49.561Z",
    "updatedAt": "2025-08-29T10:59:49.561Z"
  }],
  "delimitations": [{
    "x": 31.58,                   // ✅ Toujours en pourcentage
    "y": 19.73,
    "width": 33.89,
    "height": 39.72,
    "coordinateType": "PERCENTAGE" // ✅ Toujours spécifié
  }],
  "designTransforms": []          // ✅ Structure identique
}
```

### 2. Unifier la Logique de Calcul

#### A. Créer une fonction commune `calculateDesignPosition()`

```js
// backend/utils/designPositionCalculator.js
function calculateDesignPosition(designId, productId, adminDelimitations) {
  // Logique unique pour calculer les positions
  // Utilisée par TOUS les endpoints
  
  return {
    x: calculatedX,      // Coordonnées en pixels relatifs au centre
    y: calculatedY,      // de la délimitation
    scale: designScale,
    rotation: 0,
    constraints: {},
    designWidth: 200,
    designHeight: 200
  };
}
```

#### B. Standardiser les délimitations

```js
// backend/utils/delimitationConverter.js
function convertToPercentage(pixelDelimitation, imageWidth, imageHeight) {
  return {
    x: (pixelDelimitation.x / imageWidth) * 100,
    y: (pixelDelimitation.y / imageHeight) * 100,
    width: (pixelDelimitation.width / imageWidth) * 100,
    height: (pixelDelimitation.height / imageHeight) * 100,
    coordinateType: "PERCENTAGE"
  };
}
```

## 🔧 Actions Requises dans le Backend

### 1. Modifier `/public/new-arrivals`

```js
// Avant (❌ Incorrect)
{
  "designPosition": { x: 2, y: -44.87 },
  "delimitations": [{ x: 378.95, y: 236.74, width: 406.66, height: 476.66 }]
}

// Après (✅ Correct)
{
  "designPositions": [{
    "designId": 9,
    "position": {
      "x": -1.323659752186181,  // ✅ Même calcul que /vendor/products
      "y": 6.840766094438479,   // ✅ Cohérent
      "scale": 0.85,
      "rotation": 0,
      "constraints": {},
      "designWidth": 200,
      "designHeight": 200
    }
  }],
  "delimitations": [{
    "x": 31.58,                 // ✅ Converti en pourcentage
    "y": 19.73,
    "width": 33.89,
    "height": 39.72,
    "coordinateType": "PERCENTAGE"
  }],
  "designTransforms": []
}
```

### 2. Valider la Cohérence

**Test de cohérence à implémenter :**

```js
// backend/tests/designPositionConsistency.test.js
describe('Design Position Consistency', () => {
  it('should return identical positioning data for same product', async () => {
    const vendorProduct = await getVendorProduct(productId);
    const newArrival = await getNewArrival(productId);
    
    // Les positions doivent être IDENTIQUES
    expect(vendorProduct.designPositions[0].position.x)
      .toBe(newArrival.designPositions[0].position.x);
      
    expect(vendorProduct.designPositions[0].position.y)
      .toBe(newArrival.designPositions[0].position.y);
      
    // Les délimitations doivent être en pourcentage
    expect(newArrival.delimitations[0].coordinateType)
      .toBe("PERCENTAGE");
  });
});
```

## 🎯 Résultat Attendu

Après ces corrections, les deux APIs retourneront des données parfaitement cohérentes, permettant au frontend d'afficher les designs avec la même précision et responsivité.

### Structure Finale Unifiée

```json
{
  "designPositions": [{ 
    "position": { "x": -1.32, "y": 6.84, "scale": 0.85 } 
  }],
  "delimitations": [{ 
    "x": 31.58, "y": 19.73, "coordinateType": "PERCENTAGE" 
  }],
  "designTransforms": []
}
```

## 🚀 Impact Frontend

Une fois ces corrections implémentées, le frontend pourra :
- ✅ Afficher les designs avec la même précision dans les deux sections
- ✅ Maintenir la responsivité sur tous les écrans  
- ✅ Éliminer les débordements
- ✅ Utiliser le même composant `SimpleProductPreview` sans adaptation

**Le problème est 100% côté backend. La correction de ces APIs résoudra définitivement le problème d'affichage.**