# BUG IDENTIFIÉ: designElements contient un array imbriqué

## Le problème

Le backend reçoit et sauvegarde:
```javascript
designElements: [[]]  // Array contenant un array vide
```

Au lieu de:
```javascript
designElements: [{id: "...", type: "text", ...}]  // Array d'objets
```

## Preuve dans les logs

```javascript
designElements: Array(1)
  0: Array(0)    // ← C'est un array vide, pas un objet element!
    length: 0
```

---

## Cause probable côté Frontend

### 1. Double wrapping

```typescript
// ❌ ERREUR - Double array
const designElements = [elements];  // elements est déjà un array!

// Résultat: [[element1, element2]] au lieu de [element1, element2]
```

### 2. Mauvaise extraction du state

```typescript
// ❌ ERREUR - Si elementsByView est un objet
const elements = [elementsByView[viewKey]];  // Wrap inutile

// ✅ CORRECT
const elements = elementsByView[viewKey];  // Déjà un array
```

### 3. Spread operator manquant

```typescript
// ❌ ERREUR
const allElements = [viewElements];

// ✅ CORRECT
const allElements = [...viewElements];
// ou simplement
const allElements = viewElements;
```

---

## Comment corriger

### Étape 1: Trouver le code d'envoi

Cherchez dans le frontend où `designElements` est construit pour l'envoi API.

### Étape 2: Vérifier la structure

Ajoutez ce debug JUSTE AVANT l'envoi:

```typescript
// Dans CustomerProductCustomizationPageV3.tsx ou customizationService.ts
const payload = {
  productId,
  colorVariationId,
  viewId,
  designElements,  // ← Vérifier cette variable
  ...
};

// DEBUG
console.log('=== DEBUG DESIGN ELEMENTS ===');
console.log('designElements:', designElements);
console.log('Is Array:', Array.isArray(designElements));
console.log('Length:', designElements.length);

if (designElements.length > 0) {
  console.log('First item type:', typeof designElements[0]);
  console.log('First item is array?:', Array.isArray(designElements[0]));
  console.log('First item:', designElements[0]);

  // Si c'est un array imbriqué, c'est le bug!
  if (Array.isArray(designElements[0])) {
    console.error('🚨 BUG DÉTECTÉ: designElements est un array imbriqué!');
    console.log('Contenu du premier array:', designElements[0]);
  }
}
```

### Étape 3: Corriger le code

Une fois trouvé, corrigez:

```typescript
// Exemple de correction typique:

// AVANT (incorrect)
const designElements = [elementsByView[viewKey]];

// APRÈS (correct)
const designElements = elementsByView[viewKey] || [];
```

Ou:

```typescript
// AVANT (incorrect)
const designElements = [getCurrentElements()];

// APRÈS (correct)
const designElements = getCurrentElements();
```

---

## Fichiers à vérifier

Cherchez dans ces fichiers du frontend:

1. **`CustomerProductCustomizationPageV3.tsx`** - Là où `saveCustomization` est appelé
2. **`customizationService.ts`** - Le service qui fait l'appel API

Recherchez:
- `designElements:`
- `elementsByView`
- L'appel à `saveCustomization()`

---

## Code de test

Pour vérifier si la correction fonctionne:

```typescript
// Test structure correcte
const testElements = [
  {
    id: "test_1",
    type: "text",
    x: 0.5,
    y: 0.5,
    width: 200,
    height: 50,
    rotation: 0,
    zIndex: 0,
    text: "Test",
    fontSize: 24,
    baseFontSize: 24,
    baseWidth: 200,
    fontFamily: "Arial",
    color: "#000000",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "center",
    curve: 0
  }
];

// Vérification
console.log('Test elements:', testElements);
console.log('First is object?', typeof testElements[0] === 'object' && !Array.isArray(testElements[0]));
// Devrait afficher: true

// Si vous obtenez false, le format est incorrect
```

---

## Résumé

| Ce que vous envoyez | Ce qu'il faut envoyer |
|---------------------|----------------------|
| `[[]]` | `[]` |
| `[[element1]]` | `[element1]` |
| `[[element1, element2]]` | `[element1, element2]` |

**Le problème est un wrapping superflu dans un array.**

Trouvez la ligne qui fait:
```typescript
const designElements = [quelqueChose];
```

Et changez en:
```typescript
const designElements = quelqueChose;
```

(en vérifiant que `quelqueChose` est déjà un array d'éléments)
