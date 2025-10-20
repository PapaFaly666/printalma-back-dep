# 🔧 Guide Complet de Correction Frontend - Création de Produits

## 🎯 Problème Principal

Le frontend reçoit une erreur 500 lors de la création de produits avec catégories et variations.

**Erreur:**
```
POST https://printalma-back-dep.onrender.com/products 500 (Internal Server Error)
```

---

## ✅ Solutions à Appliquer

### Solution 1: Corriger le Nom du Champ `subCategoryId`

**Problème:** Le frontend envoie `subcategoryId` mais le backend attend `subCategoryId` (camelCase).

**Fichier:** `src/services/productService.ts`

**Ligne ~405, AVANT:**
```typescript
const backendProductData = {
  categoryId: productData.categoryId,
  subcategoryId: productData.subcategoryId,  // ❌ INCORRECT
};
```

**APRÈS:**
```typescript
const backendProductData = {
  categoryId: productData.categoryId,
  subCategoryId: productData.subCategoryId,  // ✅ CORRECT
};
```

---

### Solution 2: Supprimer `variationId` du Tableau de Variations

**Problème:** Le champ `variationId` ne doit PAS être dans le tableau des variations de couleur.

**AVANT:**
```typescript
variations: productData.variations?.map((v: any) => ({
  variationId: v.variationId,  // ❌ À SUPPRIMER
  value: v.value,
  colorCode: v.colorCode,
  price: v.price,
  stock: v.stock
}))
```

**APRÈS:**
```typescript
variations: productData.variations?.map((v: any) => ({
  value: v.value,        // ✅ Nom de la couleur
  colorCode: v.colorCode,
  price: v.price,
  stock: v.stock
}))
```

---

## 📝 Code Complet Corrigé

**Fichier:** `src/services/productService.ts`

```typescript
async createProduct(productData: any, images: File[]): Promise<any> {
  try {
    console.log('🔄 [ProductService] Création du produit...');
    console.log('🔍 [DEBUG] Données reçues:', JSON.stringify(productData, null, 2));

    // ============================================
    // ✅ PAYLOAD CORRIGÉ
    // ============================================
    const backendProductData = {
      // Informations de base
      name: productData.name,
      description: productData.description,
      price: productData.price,
      suggestedPrice: productData.suggestedPrice,
      stock: productData.stock,
      status: productData.status,

      // ✅ Hiérarchie de catégories (CORRIGÉ)
      categoryId: productData.categoryId,
      subCategoryId: productData.subCategoryId,  // ✅ camelCase avec majuscule

      // ✅ Variations de couleur (CORRIGÉ)
      variations: productData.variations?.map((v: any) => ({
        // ❌ NE PAS inclure variationId ici
        value: v.value,           // Nom de la couleur (ex: "Noir", "Blanc")
        colorCode: v.colorCode,   // Code hex (ex: "#000000")
        price: v.price,
        stock: v.stock
      })),

      // Autres champs
      genre: productData.genre,
      isReadyProduct: productData.isReadyProduct || false,
      sizes: productData.sizes || []
    };

    console.log('✅ [DEBUG] Payload corrigé:', JSON.stringify(backendProductData, null, 2));

    // ============================================
    // Construction du FormData
    // ============================================
    const formData = new FormData();
    formData.append('productData', JSON.stringify(backendProductData));

    // Ajouter les images
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        console.log(`📎 Ajout image ${index}:`, image.name);
        formData.append('images', image);
      });
    }

    // ============================================
    // Envoi de la requête
    // ============================================
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      body: formData
      // Ne pas ajouter Content-Type avec FormData
    });

    // Gestion des erreurs
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Erreur serveur'
      }));

      console.error('❌ Erreur backend:', errorData);
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Produit créé avec succès:', result);
    return result;

  } catch (error) {
    console.error('❌ [ProductService] Erreur création produit:', error);
    throw error;
  }
}
```

---

## 🔍 Vérifications Importantes

### 1. Types des Données

Vérifier que les types sont corrects :

```typescript
// ✅ CORRECT
{
  categoryId: 40,              // number
  subCategoryId: 45,           // number
  price: 6000,                 // number
  stock: 10,                   // number
  genre: "UNISEXE",            // string
  isReadyProduct: false,       // boolean
  sizes: ["S", "M", "L"],      // string[]
  variations: [                // array
    {
      value: "Noir",           // string
      colorCode: "#000000",    // string (hex)
      price: 6000,             // number
      stock: 10                // number
    }
  ]
}
```

### 2. Conversion des Types si Nécessaire

Si les IDs arrivent en string :

```typescript
const backendProductData = {
  categoryId: parseInt(productData.categoryId),      // string → number
  subCategoryId: parseInt(productData.subCategoryId), // string → number
  price: parseFloat(productData.price),               // string → number
  // ...
};
```

### 3. Gestion des Champs Optionnels

```typescript
const backendProductData = {
  // Champs requis
  name: productData.name,
  description: productData.description,
  price: productData.price,

  // Champs optionnels avec valeurs par défaut
  categoryId: productData.categoryId || undefined,
  subCategoryId: productData.subCategoryId || undefined,
  stock: productData.stock || 0,
  status: productData.status || 'draft',
  genre: productData.genre || 'UNISEXE',
  isReadyProduct: productData.isReadyProduct || false,
  sizes: productData.sizes || [],
  variations: productData.variations || []
};

// Nettoyer les undefined
const cleanedData = Object.fromEntries(
  Object.entries(backendProductData).filter(([_, v]) => v !== undefined)
);
```

---

## 🧪 Tests de Validation

### Test 1: Produit Simple Sans Catégorie

```typescript
const productData = {
  name: "Produit Test",
  description: "Description test",
  price: 1000,
  stock: 10,
  genre: "UNISEXE",
  variations: [
    {
      value: "Blanc",
      colorCode: "#FFFFFF",
      price: 1000,
      stock: 10
    }
  ]
};
```

**Résultat attendu:** HTTP 201 Created ✅

### Test 2: Produit Avec Catégorie et Sous-Catégorie

```typescript
const productData = {
  name: "T-Shirt",
  description: "T-shirt en coton",
  price: 2000,
  stock: 50,
  categoryId: 40,        // ✅ number
  subCategoryId: 45,     // ✅ number (camelCase)
  genre: "HOMME",
  variations: [
    {
      value: "Noir",
      colorCode: "#000000",
      price: 2000,
      stock: 20
    },
    {
      value: "Blanc",
      colorCode: "#FFFFFF",
      price: 2000,
      stock: 30
    }
  ]
};
```

**Résultat attendu:** HTTP 201 Created ✅

### Test 3: Produit Avec Images

```typescript
const images = [
  new File([blob], "front.jpg", { type: "image/jpeg" }),
  new File([blob], "back.jpg", { type: "image/jpeg" })
];

await productService.createProduct(productData, images);
```

**Résultat attendu:** HTTP 201 Created ✅

---

## 🔧 Débogage

### Activer les Logs Détaillés

```typescript
async createProduct(productData: any, images: File[]): Promise<any> {
  // Logs avant transformation
  console.group('🔍 DEBUT CRÉATION PRODUIT');
  console.log('1. Données reçues:', productData);
  console.log('2. Images reçues:', images.length);

  // Logs payload
  console.log('3. Payload construit:', backendProductData);

  // Logs FormData
  console.log('4. FormData contents:');
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`   ${key}: File(${value.name}, ${value.size} bytes)`);
    } else {
      console.log(`   ${key}:`, value);
    }
  }

  // Logs réponse
  const response = await fetch(...);
  console.log('5. Réponse HTTP:', response.status, response.statusText);

  console.groupEnd();
}
```

### Vérifier le Payload Envoyé

```typescript
// Juste avant l'envoi
console.log('📦 PAYLOAD FINAL:');
console.log(JSON.stringify(backendProductData, null, 2));

// Copier-coller dans un outil JSON validator
// https://jsonlint.com/
```

### Vérifier la Réponse Serveur

```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error('❌ Erreur serveur (raw):', errorText);

  try {
    const errorJson = JSON.parse(errorText);
    console.error('❌ Erreur serveur (JSON):', errorJson);
  } catch (e) {
    console.error('❌ Impossible de parser l\'erreur');
  }
}
```

---

## 📋 Checklist Complète de Correction

### Étape 1: Corrections du Code
- [ ] Ouvrir `src/services/productService.ts`
- [ ] Remplacer `subcategoryId` par `subCategoryId` (camelCase)
- [ ] Supprimer `variationId` du tableau `variations`
- [ ] Vérifier les types des données (number vs string)
- [ ] Sauvegarder le fichier

### Étape 2: Validation
- [ ] Vérifier la console pour les logs
- [ ] Confirmer que le payload a la bonne structure
- [ ] Vérifier que `subCategoryId` est en camelCase
- [ ] Vérifier qu'il n'y a pas de `variationId` dans `variations`

### Étape 3: Tests
- [ ] Tester création produit sans catégorie
- [ ] Tester création produit avec catégorie
- [ ] Tester création produit avec sous-catégorie
- [ ] Tester création produit avec images
- [ ] Confirmer HTTP 201 Created

### Étape 4: Déploiement
- [ ] Commit des changements
- [ ] Push vers le repository
- [ ] Tester en production
- [ ] Valider avec l'équipe

---

## 🎯 Résumé des Changements

| Avant | Après | Raison |
|-------|-------|--------|
| `subcategoryId` | `subCategoryId` | Backend attend camelCase |
| `variationId: v.variationId` | ❌ Supprimé | Ne doit pas être dans variations de couleur |
| String IDs | Number IDs | Backend attend des numbers |

---

## 🚀 Exemple Complet de Création

```typescript
// composant React
import { productService } from './services/productService';

const handleCreateProduct = async () => {
  try {
    const productData = {
      name: "Mugs à café",
      description: "Mug personnalisable",
      price: 6000,
      suggestedPrice: 12000,
      stock: 0,
      status: "published",
      categoryId: 40,           // ✅ number
      subCategoryId: 45,        // ✅ camelCase
      genre: "UNISEXE",
      isReadyProduct: false,
      sizes: ["Standard"],
      variations: [
        {
          value: "Blanc",       // ✅ Pas de variationId
          colorCode: "#FFFFFF",
          price: 6000,
          stock: 10
        }
      ]
    };

    const images = [
      selectedImage // File object
    ];

    const result = await productService.createProduct(productData, images);
    console.log('✅ Produit créé:', result);

    // Afficher succès à l'utilisateur
    toast.success('Produit créé avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
    toast.error(error.message);
  }
};
```

---

## 📞 Support

Si l'erreur persiste après ces corrections :

1. **Vérifier les logs backend** pour l'erreur exacte
2. **Vérifier la base de données**:
   - Les IDs existent (categoryId: 40, subCategoryId: 45)
   - Les contraintes de clé étrangère sont respectées
3. **Vérifier le format des images**:
   - Type MIME valide (image/jpeg, image/png)
   - Taille raisonnable (< 5MB)
4. **Consulter les guides**:
   - `SOLUTION_FRONTEND_ERREUR_500.md`
   - `SOLUTION_FRONTEND_VARIATIONID.md`
   - `GUIDE_INTEGRATION_FRONTEND_PROTECTION_CATEGORIES.md`

---

## ✅ Validation Finale

Après toutes les corrections, votre payload devrait ressembler à :

```json
{
  "name": "Mugs à café",
  "description": "Mug personnalisable",
  "price": 6000,
  "suggestedPrice": 12000,
  "stock": 0,
  "status": "published",
  "categoryId": 40,
  "subCategoryId": 45,
  "variations": [
    {
      "value": "Blanc",
      "colorCode": "#FFFFFF",
      "price": 6000,
      "stock": 10
    }
  ],
  "genre": "UNISEXE",
  "isReadyProduct": false,
  "sizes": ["Standard"]
}
```

**Résultat attendu:** HTTP 201 Created ✅

Bon courage ! 🚀
