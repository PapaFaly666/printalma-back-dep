# Guide de Résolution - Erreur "Au moins une catégorie est requise"

## 📋 Problème

Le backend retourne l'erreur suivante lors de la création d'un produit :
```
❌ [ProductService] Erreur création produit: Error: Au moins une catégorie est requise
    at ProductService.createProduct (productService.ts:335:15)
```

## 🔍 Analyse de l'erreur

### Données actuellement envoyées par le frontend
```json
{
  "name": "Meghan Jenkins",
  "description": "Qui aspernatur volup",
  "price": 772,
  "suggestedPrice": 772,
  "stock": 83,
  "status": "published",
  "categoryId": 5,        // ❌ Le backend n'utilise PAS ces IDs directement
  "subCategoryId": 5,     // ❌
  "variationId": 11,      // ❌
  "sizes": ["fezfez", "fzefze"],
  "genre": "UNISEXE",
  "isReadyProduct": false,
  "colorVariations": [...]
}
```

### Ce que le backend attend RÉELLEMENT

D'après le DTO backend (`src/product/dto/create-product.dto.ts:259-260`) :

```typescript
@ArrayMinSize(1, { message: 'Au moins une catégorie est requise' })
categories: string[];  // ⚠️ OBLIGATOIRE : Array de NOMS de catégories (strings)
```

**Le backend attend un champ `categories` qui est un array de strings (noms de catégories), PAS des IDs numériques !**

## ✅ Solution

### Option 1 : Récupérer les noms des catégories depuis les IDs

Si vous avez déjà les objets catégories dans votre state :

```typescript
// Dans votre composant de formulaire
const handleSubmit = async () => {
  // 1. Récupérer les objets catégories depuis vos states/contexts
  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
  const selectedSubCategory = subCategories.find(sub => sub.id === formData.subCategoryId);
  const selectedVariation = variations.find(var => var.id === formData.variationId);

  // 2. Créer l'array de noms de catégories
  const categoryNames = [];
  if (selectedCategory?.name) {
    categoryNames.push(selectedCategory.name);
  }
  // Optionnel : ajouter aussi la sous-catégorie et variation si nécessaire
  // if (selectedSubCategory?.name) categoryNames.push(selectedSubCategory.name);
  // if (selectedVariation?.name) categoryNames.push(selectedVariation.name);

  // 3. Construire les données à envoyer
  const productData = {
    ...formData,
    categories: categoryNames,  // ✅ Array de strings REQUIS
    categoryId: formData.categoryId,      // Ces IDs sont optionnels mais utiles
    subCategoryId: formData.subCategoryId,
    variationId: formData.variationId,
  };

  // 4. Envoyer au backend
  await createProduct(productData);
};
```

### Option 2 : Faire un appel API pour récupérer les noms

Si vous n'avez pas les objets catégories en mémoire :

```typescript
const handleSubmit = async () => {
  const categoryNames = [];

  // Récupérer le nom de la catégorie
  if (formData.categoryId) {
    const category = await fetch(`/api/categories/${formData.categoryId}`).then(r => r.json());
    categoryNames.push(category.name);
  }

  const productData = {
    ...formData,
    categories: categoryNames,  // ✅ Array de strings
    categoryId: formData.categoryId,
    subCategoryId: formData.subCategoryId,
    variationId: formData.variationId,
  };

  await createProduct(productData);
};
```

### Option 3 : Mapper directement si vous avez un contexte/store

```typescript
// Si vous utilisez un context ou store global
import { useCategoryContext } from './contexts/CategoryContext';

const MyComponent = () => {
  const { getCategoryById } = useCategoryContext();

  const handleSubmit = async () => {
    const category = getCategoryById(formData.categoryId);

    const productData = {
      ...formData,
      categories: category ? [category.name] : [],  // ✅ Array de strings
      categoryId: formData.categoryId,
      subCategoryId: formData.subCategoryId,
      variationId: formData.variationId,
    };

    await createProduct(productData);
  };
};
```

## 📝 Structure complète des données à envoyer

```typescript
interface ProductCreationData {
  // Champs obligatoires de base
  name: string;
  description: string;
  price: number;
  suggestedPrice: number;
  stock: number;
  status: 'draft' | 'published' | 'archived';

  // ⚠️ OBLIGATOIRE : Array de noms de catégories (strings)
  categories: string[];  // Ex: ["T-Shirts", "Vêtements"]

  // Hiérarchie de catégories (optionnel mais recommandé)
  categoryId?: number;      // ID de la catégorie principale
  subCategoryId?: number;   // ID de la sous-catégorie
  variationId?: number;     // ID de la variation

  // Autres champs
  sizes: string[];
  genre: 'HOMME' | 'FEMME' | 'UNISEXE';
  isReadyProduct: boolean;
  colorVariations: ColorVariation[];
}
```

## 🔧 Exemple complet de modification

### Avant (❌ Ne fonctionne pas)
```typescript
const createProduct = async () => {
  const data = {
    name: formData.name,
    description: formData.description,
    price: formData.price,
    categoryId: 5,        // ❌ Le backend ignore ces IDs
    subCategoryId: 5,     // si 'categories' est absent
    variationId: 11,
    // ... autres champs
  };

  await api.post('/products', data);
};
```

### Après (✅ Fonctionne)
```typescript
const createProduct = async () => {
  // Récupérer le nom de la catégorie
  const category = categories.find(c => c.id === formData.categoryId);

  const data = {
    name: formData.name,
    description: formData.description,
    price: formData.price,
    categories: [category.name],  // ✅ Array de strings OBLIGATOIRE
    categoryId: formData.categoryId,      // Optionnel mais utile
    subCategoryId: formData.subCategoryId,
    variationId: formData.variationId,
    // ... autres champs
  };

  await api.post('/products', data);
};
```

## 🎯 Points clés à retenir

1. **Le champ `categories` est OBLIGATOIRE** et doit être un array de strings
2. **Au minimum 1 nom de catégorie** doit être fourni dans l'array
3. Les champs `categoryId`, `subCategoryId`, `variationId` sont **optionnels** mais recommandés pour la hiérarchie
4. **Ne pas confondre** : `categories` (noms en strings) ≠ `categoryId` (ID numérique)

## 🔍 Validation des données avant envoi

Ajoutez cette validation dans votre code :

```typescript
const validateProductData = (data: any): boolean => {
  // Vérifier que categories existe et n'est pas vide
  if (!data.categories || !Array.isArray(data.categories) || data.categories.length === 0) {
    console.error('❌ Le champ "categories" est requis et doit contenir au moins un élément');
    return false;
  }

  // Vérifier que ce sont bien des strings
  if (!data.categories.every(cat => typeof cat === 'string')) {
    console.error('❌ Le champ "categories" doit contenir des strings (noms), pas des IDs');
    return false;
  }

  console.log('✅ Validation OK - categories:', data.categories);
  return true;
};

// Utilisation
const handleSubmit = async () => {
  const productData = {
    // ... construire vos données
  };

  if (!validateProductData(productData)) {
    return; // Ne pas envoyer si la validation échoue
  }

  await createProduct(productData);
};
```

## 📊 Exemple de données valides complètes

```json
{
  "name": "T-Shirt Personnalisé",
  "description": "T-shirt 100% coton personnalisable",
  "price": 29.99,
  "suggestedPrice": 39.99,
  "stock": 100,
  "status": "published",

  "categories": ["T-Shirts"],  // ✅ OBLIGATOIRE : Array de strings

  "categoryId": 5,           // Optionnel : pour la hiérarchie
  "subCategoryId": 5,        // Optionnel
  "variationId": 11,         // Optionnel

  "sizes": ["S", "M", "L", "XL"],
  "genre": "UNISEXE",
  "isReadyProduct": false,

  "colorVariations": [
    {
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "stockBySize": {
        "S": 10,
        "M": 20,
        "L": 15,
        "XL": 10
      },
      "images": [
        {
          "fileId": "1760398128237",
          "view": "Front",
          "delimitations": [
            {
              "x": 330.39,
              "y": 440.29,
              "width": 843.14,
              "height": 862.75,
              "rotation": 0
            }
          ]
        }
      ]
    }
  ]
}
```

## 🚀 Checklist de résolution

- [ ] Identifier où vous stockez les informations de catégories dans votre frontend
- [ ] Récupérer le nom de la catégorie depuis son ID
- [ ] Créer un array `categories: [categoryName]`
- [ ] Ajouter le champ `categories` aux données envoyées au backend
- [ ] Conserver les champs `categoryId`, `subCategoryId`, `variationId` pour la hiérarchie
- [ ] Ajouter une validation pour vérifier que `categories` est bien un array de strings non vide
- [ ] Tester la création d'un produit
- [ ] Vérifier dans les logs que l'erreur a disparu

## ❓ FAQ

### Q: Puis-je envoyer plusieurs noms dans le array categories ?
**R:** Oui, vous pouvez envoyer plusieurs noms. Par exemple :
```typescript
categories: ["T-Shirts", "Vêtements éco-responsables", "Coton bio"]
```

### Q: Dois-je supprimer categoryId, subCategoryId et variationId ?
**R:** Non, gardez-les ! Ils sont optionnels mais utiles pour maintenir la hiérarchie des catégories. Le backend les utilise également.

### Q: Que se passe-t-il si je n'ai pas de catégorie sélectionnée ?
**R:** Le formulaire doit empêcher la soumission ou afficher un message d'erreur. Le backend rejettera la requête de toute façon.

### Q: Le nom de la catégorie doit-il correspondre exactement à celui en base de données ?
**R:** Oui, idéalement. Le backend va probablement rechercher ou créer les catégories basées sur ces noms.

---

**Date de création:** 2025-10-13
**Fichier de référence:** `correct.md`
**Erreur ciblée:** "Au moins une catégorie est requise" (productService.ts:335)
