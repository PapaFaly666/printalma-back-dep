# Guide API Catégories - Pour le Frontend

## 📋 Base URL

```
http://localhost:3004/categories
```

---

## 🎯 Endpoints Disponibles

### 1. GET `/categories` - Lister toutes les catégories

Récupère toutes les catégories avec leurs relations parent/enfants.

**Request:**
```http
GET /categories
```

**Response: 200 OK**
```json
[
  {
    "id": 1,
    "name": "Téléphone",
    "description": "Accessoires téléphone",
    "parentId": null,
    "level": 0,
    "order": 0,
    "createdAt": "2025-09-30T10:00:00.000Z",
    "updatedAt": "2025-09-30T10:00:00.000Z",
    "parent": null,
    "children": [
      {
        "id": 2,
        "name": "Coque",
        "parentId": 1,
        "level": 1,
        "children": [...]
      }
    ],
    "_count": {
      "products": 5
    }
  }
]
```

---

### 2. GET `/categories/hierarchy` - Récupérer l'arbre hiérarchique

Récupère les catégories organisées en structure d'arbre (parents → enfants → variations).

**Request:**
```http
GET /categories/hierarchy
```

**Response: 200 OK**
```json
[
  {
    "id": 1,
    "name": "Téléphone",
    "description": "Accessoires téléphone",
    "parentId": null,
    "level": 0,
    "order": 0,
    "productCount": 5,
    "subcategories": [
      {
        "id": 2,
        "name": "Coque",
        "parentId": 1,
        "level": 1,
        "productCount": 3,
        "subcategories": [
          {
            "id": 3,
            "name": "iPhone 13",
            "parentId": 2,
            "level": 2,
            "productCount": 1,
            "subcategories": []
          },
          {
            "id": 4,
            "name": "iPhone 14",
            "parentId": 2,
            "level": 2,
            "productCount": 2,
            "subcategories": []
          }
        ]
      }
    ]
  }
]
```

**Utilisation frontend:**
```typescript
const categories = await fetch('/api/categories/hierarchy').then(r => r.json());

// Afficher l'arbre
categories.forEach(parent => {
  console.log(`📁 ${parent.name} (${parent.productCount} produits)`);

  parent.subcategories.forEach(child => {
    console.log(`  📂 ${child.name} (${child.productCount} produits)`);

    child.subcategories.forEach(variation => {
      console.log(`    📄 ${variation.name} (${variation.productCount} produits)`);
    });
  });
});
```

---

### 3. GET `/categories/:id` - Récupérer une catégorie

Récupère une catégorie spécifique avec ses enfants et son parent.

**Request:**
```http
GET /categories/1
```

**Response: 200 OK**
```json
{
  "id": 1,
  "name": "Téléphone",
  "description": "Accessoires téléphone",
  "parentId": null,
  "level": 0,
  "order": 0,
  "createdAt": "2025-09-30T10:00:00.000Z",
  "updatedAt": "2025-09-30T10:00:00.000Z",
  "parent": null,
  "children": [
    {
      "id": 2,
      "name": "Coque",
      "parentId": 1,
      "level": 1,
      "children": [
        {
          "id": 3,
          "name": "iPhone 13",
          "parentId": 2,
          "level": 2
        }
      ]
    }
  ],
  "productCount": 5
}
```

**Response: 404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Catégorie avec ID 999 non trouvée"
}
```

---

### 4. GET `/categories/check-duplicate` - Vérifier les doublons

Vérifie si une catégorie avec ce nom existe déjà dans le parent spécifié.

**Request:**
```http
GET /categories/check-duplicate?name=iPhone 14&parentId=2
```

**Query Parameters:**
- `name` (string, requis) : Nom de la catégorie
- `parentId` (number, optionnel) : ID du parent (null pour catégorie racine)

**Response: 200 OK (existe)**
```json
{
  "exists": true,
  "category": {
    "id": 4,
    "name": "iPhone 14",
    "description": "Variation de Coque",
    "parentId": 2,
    "level": 2,
    "order": 0
  }
}
```

**Response: 200 OK (n'existe pas)**
```json
{
  "exists": false,
  "category": null
}
```

**Utilisation frontend:**
```typescript
// Avant de créer une catégorie
const checkResponse = await fetch(
  `/api/categories/check-duplicate?name=${encodeURIComponent('iPhone 15')}&parentId=2`
);
const { exists, category } = await checkResponse.json();

if (exists) {
  console.log('La catégorie existe déjà:', category);
  // Afficher un message à l'utilisateur
} else {
  // Procéder à la création
}
```

---

### 5. POST `/categories` - Créer une catégorie

Crée une nouvelle catégorie (parent, sous-catégorie ou variation) avec vérification des doublons.

**Request:**
```http
POST /categories
Content-Type: application/json

{
  "name": "iPhone 15",
  "description": "Variation de Coque",
  "parentId": 2,
  "level": 2,
  "order": 0
}
```

**Body Parameters:**
- `name` (string, requis) : Nom de la catégorie
- `description` (string, optionnel) : Description
- `parentId` (number, optionnel) : ID du parent (null pour catégorie racine)
- `level` (number, optionnel) : Niveau (0, 1 ou 2) - calculé automatiquement si non fourni
- `order` (number, optionnel) : Ordre d'affichage (défaut: 0)

**Response: 201 Created**
```json
{
  "success": true,
  "message": "Catégorie créée avec succès",
  "data": {
    "id": 5,
    "name": "iPhone 15",
    "description": "Variation de Coque",
    "parentId": 2,
    "level": 2,
    "order": 0,
    "createdAt": "2025-09-30T10:30:00.000Z",
    "updatedAt": "2025-09-30T10:30:00.000Z",
    "parent": {
      "id": 2,
      "name": "Coque",
      "level": 1
    },
    "children": []
  }
}
```

**Response: 409 Conflict (doublon)**
```json
{
  "statusCode": 409,
  "message": {
    "success": false,
    "error": "DUPLICATE_CATEGORY",
    "message": "La catégorie \"iPhone 15\" existe déjà dans cette catégorie parent",
    "existingCategory": {
      "id": 5,
      "name": "iPhone 15",
      "parentId": 2
    }
  }
}
```

**Response: 404 Not Found (parent introuvable)**
```json
{
  "statusCode": 404,
  "message": "Catégorie parent avec ID 999 non trouvée"
}
```

**Utilisation frontend:**
```typescript
// Créer une catégorie parent
const parent = await fetch('/api/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Vêtements',
    description: 'Vêtements personnalisables'
  })
}).then(r => r.json());

// Créer une sous-catégorie
const child = await fetch('/api/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'T-Shirt',
    parentId: parent.data.id
  })
}).then(r => r.json());

// Créer une variation
const variation = await fetch('/api/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Homme',
    parentId: child.data.id
  })
}).then(r => r.json());
```

---

### 6. POST `/categories/structure` - Créer une structure complète

Crée automatiquement la hiérarchie complète (parent → sous-catégorie → variations) en une seule requête. Réutilise les catégories existantes et saute les doublons.

**Request:**
```http
POST /categories/structure
Content-Type: application/json

{
  "parentName": "Téléphone",
  "parentDescription": "Accessoires téléphone",
  "childName": "Coque",
  "variations": ["iPhone 13", "iPhone 14", "iPhone 15"]
}
```

**Body Parameters:**
- `parentName` (string, requis) : Nom de la catégorie parent
- `parentDescription` (string, optionnel) : Description du parent
- `childName` (string, optionnel) : Nom de la sous-catégorie
- `variations` (string[], requis) : Liste des variations à créer

**Response: 201 Created**
```json
{
  "success": true,
  "createdCount": 5,
  "skippedVariations": [],
  "message": "Structure créée avec succès ! 5 nouveau(x) élément(s) ajouté(s).",
  "data": {
    "parent": {
      "id": 1,
      "name": "Téléphone",
      "level": 0
    },
    "child": {
      "id": 2,
      "name": "Coque",
      "level": 1,
      "parentId": 1
    },
    "totalVariations": 3,
    "createdVariations": 3
  }
}
```

**Response avec doublons:**
```json
{
  "success": true,
  "createdCount": 2,
  "skippedVariations": ["iPhone 13", "iPhone 14"],
  "message": "Structure créée avec succès ! 2 nouveau(x) élément(s) ajouté(s).",
  "data": {
    "parent": {
      "id": 1,
      "name": "Téléphone",
      "level": 0
    },
    "child": {
      "id": 2,
      "name": "Coque",
      "level": 1,
      "parentId": 1
    },
    "totalVariations": 3,
    "createdVariations": 1
  }
}
```

**Utilisation frontend:**
```typescript
// Créer une structure complète d'un coup
const result = await fetch('/api/categories/structure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    parentName: 'Vêtements',
    parentDescription: 'Vêtements personnalisables',
    childName: 'T-Shirt',
    variations: ['Homme', 'Femme', 'Enfant', 'Unisexe']
  })
}).then(r => r.json());

console.log(`✅ ${result.createdCount} éléments créés`);
if (result.skippedVariations.length > 0) {
  console.log(`⚠️ Variations sautées (déjà existantes):`, result.skippedVariations);
}
```

---

### 7. PATCH `/categories/:id` - Modifier une catégorie

Modifie les informations d'une catégorie existante.

**Request:**
```http
PATCH /categories/5
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "description": "Variation de Coque - Mise à jour"
}
```

**Body Parameters:**
- `name` (string, optionnel) : Nouveau nom
- `description` (string, optionnel) : Nouvelle description
- `order` (number, optionnel) : Nouvel ordre

**Note:** On ne peut pas modifier `parentId` ou `level` pour éviter de casser la hiérarchie.

**Response: 200 OK**
```json
{
  "id": 5,
  "name": "iPhone 15 Pro",
  "description": "Variation de Coque - Mise à jour",
  "parentId": 2,
  "level": 2,
  "order": 0,
  "createdAt": "2025-09-30T10:30:00.000Z",
  "updatedAt": "2025-09-30T11:00:00.000Z"
}
```

**Response: 404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Catégorie avec ID 999 non trouvée"
}
```

---

### 8. DELETE `/categories/:id` - Supprimer une catégorie

Supprime une catégorie et **tous ses enfants** en cascade.

**Request:**
```http
DELETE /categories/1
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Catégorie supprimée avec succès",
  "deletedCount": 5
}
```

**Response: 400 Bad Request (produits liés)**
```json
{
  "statusCode": 400,
  "message": "Impossible de supprimer la catégorie car elle (ou ses sous-catégories) est liée à 10 produit(s). Veuillez d'abord supprimer ou déplacer ces produits vers une autre catégorie."
}
```

**Response: 404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Catégorie avec ID 999 non trouvée"
}
```

**Utilisation frontend:**
```typescript
// Supprimer avec confirmation
if (confirm(`Êtes-vous sûr de vouloir supprimer cette catégorie ? Cela supprimera aussi toutes ses sous-catégories.`)) {
  try {
    const result = await fetch(`/api/categories/${categoryId}`, {
      method: 'DELETE'
    }).then(r => r.json());

    alert(`✅ ${result.deletedCount} catégorie(s) supprimée(s)`);
  } catch (error) {
    alert('❌ Erreur: ' + error.message);
  }
}
```

---

## 📊 Niveaux de hiérarchie

| Level | Type | Exemple | Parent |
|-------|------|---------|--------|
| 0 | Catégorie parent | "Téléphone" | null |
| 1 | Sous-catégorie | "Coque" | ID du parent |
| 2 | Variation | "iPhone 13" | ID de la sous-catégorie |

---

## 🔍 Exemples de workflows frontend

### Workflow 1: Créer une structure complète

```typescript
async function createCategoryStructure(formData) {
  try {
    const response = await fetch('/api/categories/structure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: formData.parent,
        parentDescription: formData.parentDesc,
        childName: formData.child,
        variations: formData.variations // ['Var1', 'Var2', ...]
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ ${result.createdCount} éléments créés`);

      if (result.skippedVariations.length > 0) {
        console.warn('Variations déjà existantes:', result.skippedVariations);
      }

      // Rafraîchir la liste des catégories
      await loadCategories();
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

### Workflow 2: Vérifier avant de créer

```typescript
async function createCategoryWithCheck(name, parentId) {
  // 1. Vérifier si existe
  const checkUrl = `/api/categories/check-duplicate?name=${encodeURIComponent(name)}`;
  const checkParams = parentId ? `${checkUrl}&parentId=${parentId}` : checkUrl;

  const { exists, category } = await fetch(checkParams).then(r => r.json());

  if (exists) {
    alert(`La catégorie "${name}" existe déjà !`);
    return category;
  }

  // 2. Créer si n'existe pas
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      parentId: parentId || undefined
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log('✅ Catégorie créée:', result.data);
    return result.data;
  }
}
```

### Workflow 3: Afficher l'arbre hiérarchique

```typescript
async function displayCategoryTree() {
  const categories = await fetch('/api/categories/hierarchy').then(r => r.json());

  function renderCategory(cat, depth = 0) {
    const indent = '  '.repeat(depth);
    const icon = depth === 0 ? '📁' : depth === 1 ? '📂' : '📄';

    console.log(`${indent}${icon} ${cat.name} (${cat.productCount} produits)`);

    cat.subcategories?.forEach(sub => renderCategory(sub, depth + 1));
  }

  categories.forEach(cat => renderCategory(cat));
}
```

### Workflow 4: Supprimer avec gestion d'erreur

```typescript
async function deleteCategory(id) {
  const confirmed = confirm(
    'Êtes-vous sûr ? Cette action supprimera aussi toutes les sous-catégories.'
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      const result = await response.json();
      alert(`✅ ${result.deletedCount} catégorie(s) supprimée(s)`);
      await loadCategories(); // Rafraîchir
    } else {
      const error = await response.json();
      alert(`❌ ${error.message}`);
    }
  } catch (error) {
    alert('❌ Erreur réseau: ' + error.message);
  }
}
```

---

## 🎨 Composant React exemple

```typescript
import { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  level: number;
  parentId: number | null;
  productCount: number;
  subcategories: Category[];
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);

  // Charger les catégories
  useEffect(() => {
    fetch('/api/categories/hierarchy')
      .then(r => r.json())
      .then(setCategories);
  }, []);

  // Créer une structure
  const handleCreateStructure = async (data: {
    parentName: string;
    childName?: string;
    variations: string[];
  }) => {
    const response = await fetch('/api/categories/structure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      alert(`✅ ${result.createdCount} éléments créés`);
      // Recharger
      const updated = await fetch('/api/categories/hierarchy').then(r => r.json());
      setCategories(updated);
    }
  };

  // Afficher récursivement
  const renderCategory = (cat: Category, depth = 0) => (
    <div key={cat.id} style={{ marginLeft: depth * 20 }}>
      {cat.level === 0 ? '📁' : cat.level === 1 ? '📂' : '📄'} {cat.name}
      ({cat.productCount} produits)

      {cat.subcategories?.map(sub => renderCategory(sub, depth + 1))}
    </div>
  );

  return (
    <div>
      <h2>Catégories</h2>
      {categories.map(cat => renderCategory(cat))}
    </div>
  );
}
```

---

## ⚠️ Erreurs courantes

### Erreur 409: Doublon
```json
{
  "statusCode": 409,
  "message": {
    "error": "DUPLICATE_CATEGORY",
    "message": "La catégorie existe déjà"
  }
}
```
**Solution:** Vérifier avec `/check-duplicate` avant de créer

### Erreur 404: Parent introuvable
```json
{
  "statusCode": 404,
  "message": "Catégorie parent avec ID 999 non trouvée"
}
```
**Solution:** Vérifier que le `parentId` existe

### Erreur 400: Produits liés
```json
{
  "statusCode": 400,
  "message": "Impossible de supprimer la catégorie car elle est liée à 10 produit(s)"
}
```
**Solution:** Déplacer ou supprimer les produits d'abord

---

## 📞 Support

Pour toute question sur l'utilisation de l'API, référez-vous à :
- `CATEGORY_HIERARCHY_IMPLEMENTATION.md` : Documentation technique complète
- `ha.md` : Guide de la logique frontend
