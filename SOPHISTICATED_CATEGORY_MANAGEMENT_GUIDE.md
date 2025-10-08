# 🎯 Guide Système Sophistiqué de Gestion des Catégories

## 📋 Vue d'ensemble

Ce guide documente le système sophistiqué de gestion des catégories, sous-catégories et variations avec synchronisation automatique et contraintes de suppression.

## ✨ Fonctionnalités Clés

### 1. **Synchronisation Automatique** 🔄
Lorsqu'un admin modifie une catégorie/sous-catégorie, **tous les produits liés** se mettent à jour automatiquement.

### 2. **Contraintes de Suppression** 🚫
Impossible de supprimer une catégorie si des produits y sont liés. Les produits doivent d'abord être déplacés.

### 3. **Structure Hiérarchique** 📊
- **Niveau 0** : Catégorie parent (ex: "Téléphone")
- **Niveau 1** : Sous-catégorie (ex: "Coque")
- **Niveau 2** : Variation (ex: "iPhone 13", "iPhone 14")

---

## 🔧 Backend - Implémentation

### Structure Prisma (Many-to-Many)

```prisma
model Category {
  id          Int        @id @default(autoincrement())
  name        String
  description String?
  parentId    Int?
  level       Int        @default(0)
  order       Int        @default(0)

  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]  @relation("CategoryToProduct") // ✅ Relation Many-to-Many

  @@unique([name, parentId], name: "unique_category_per_parent")
  @@map("categories")
}

model Product {
  id          Int        @id @default(autoincrement())
  name        String
  categories  Category[] @relation("CategoryToProduct") // ✅ Relation Many-to-Many
  // ... autres champs
}
```

**💡 Point Clé** : La relation many-to-many via Prisma crée automatiquement une table de jointure `_CategoryToProduct` qui gère la synchronisation.

---

## 🚀 API Endpoints Backend

### 1. Créer une Catégorie

**Endpoint** : `POST /categories`

**Body** :
```json
{
  "name": "Téléphone",
  "description": "Accessoires téléphone",
  "parentId": null,
  "level": 0
}
```

**Response** :
```json
{
  "success": true,
  "message": "Catégorie créée avec succès",
  "data": {
    "id": 1,
    "name": "Téléphone",
    "description": "Accessoires téléphone",
    "level": 0,
    "parentId": null
  }
}
```

---

### 2. Mettre à Jour une Catégorie (avec Synchronisation)

**Endpoint** : `PATCH /categories/:id`

**Body** :
```json
{
  "name": "Smartphones",
  "description": "Accessoires smartphones"
}
```

**Response** :
```json
{
  "success": true,
  "message": "Catégorie mise à jour avec succès (5 produit(s) synchronisé(s))",
  "data": {
    "id": 1,
    "name": "Smartphones",
    "description": "Accessoires smartphones",
    "productCount": 5
  }
}
```

**🔄 Synchronisation Automatique** :
- Prisma met à jour automatiquement la relation via `_CategoryToProduct`
- Tous les produits liés affichent le nouveau nom instantanément
- Le backend compte et affiche le nombre de produits synchronisés

**Code Backend** (`category.service.ts`) :
```typescript
async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    // Vérifier les doublons
    if (updateCategoryDto.name && updateCategoryDto.name.trim() !== category.name) {
        const existingCategory = await this.prisma.category.findFirst({
            where: {
                name: updateCategoryDto.name.trim(),
                parentId: category.parentId || null,
                id: { not: id }
            }
        });

        if (existingCategory) {
            throw new ConflictException({
                success: false,
                error: 'DUPLICATE_CATEGORY',
                message: `Une catégorie avec le nom "${updateCategoryDto.name}" existe déjà`
            });
        }
    }

    // Mettre à jour la catégorie
    const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: {
            name: updateCategoryDto.name?.trim(),
            description: updateCategoryDto.description?.trim()
        },
        include: {
            parent: true,
            children: true,
            _count: { select: { products: true } }
        }
    });

    // 🔄 Compter les produits synchronisés
    if (updateCategoryDto.name && updateCategoryDto.name.trim() !== category.name) {
        const productsToUpdate = await this.prisma.product.findMany({
            where: {
                categories: { some: { id } }
            },
            select: { id: true }
        });

        console.log(`🔄 Synchronisation: ${productsToUpdate.length} produit(s) liés`);
    }

    return {
        success: true,
        message: `Catégorie mise à jour avec succès${updatedCategory._count.products > 0 ? ` (${updatedCategory._count.products} produit(s) synchronisé(s))` : ''}`,
        data: {
            ...updatedCategory,
            productCount: updatedCategory._count.products
        }
    };
}
```

---

### 3. Supprimer une Catégorie (avec Contraintes)

**Endpoint** : `DELETE /categories/:id`

**Scénario 1 - Catégorie SANS produits liés** :
```http
DELETE /categories/5
```

**Response** :
```json
{
  "success": true,
  "message": "Catégorie supprimée avec succès",
  "deletedCount": 1
}
```

**Scénario 2 - Catégorie AVEC produits liés** :
```http
DELETE /categories/1
```

**Response (Error 400)** :
```json
{
  "statusCode": 400,
  "message": "Impossible de supprimer la catégorie car elle (ou ses sous-catégories) est liée à 5 produit(s). Veuillez d'abord supprimer ou déplacer ces produits vers une autre catégorie.",
  "error": "Bad Request"
}
```

**🚫 Contrainte de Suppression** :
- Le backend vérifie récursivement tous les enfants de la catégorie
- Compte le nombre total de produits liés (catégorie + enfants)
- Bloque la suppression si des produits sont trouvés

**Code Backend** (`category.service.ts`) :
```typescript
async remove(id: number) {
    const category = await this.findOne(id);

    // Récupérer tous les IDs des enfants (récursif)
    const childrenIds = await this.getAllChildrenIds(id);
    const allIds = [id, ...childrenIds];

    // 🚫 Vérifier si des produits sont liés
    const productsCount = await this.prisma.product.count({
        where: {
            categories: {
                some: { id: { in: allIds } }
            }
        }
    });

    if (productsCount > 0) {
        throw new BadRequestException(
            `Impossible de supprimer la catégorie car elle (ou ses sous-catégories) est liée à ${productsCount} produit(s). ` +
            `Veuillez d'abord supprimer ou déplacer ces produits vers une autre catégorie.`
        );
    }

    // Suppression en cascade (enfants supprimés automatiquement)
    await this.prisma.category.delete({
        where: { id },
    });

    return {
        success: true,
        message: 'Catégorie supprimée avec succès',
        deletedCount: allIds.length
    };
}

private async getAllChildrenIds(parentId: number): Promise<number[]> {
    const children = await this.prisma.category.findMany({
        where: { parentId },
        select: { id: true }
    });

    let allIds: number[] = [];

    for (const child of children) {
        allIds.push(child.id);
        const subChildren = await this.getAllChildrenIds(child.id);
        allIds = [...allIds, ...subChildren];
    }

    return allIds;
}
```

---

### 4. Déplacer des Produits entre Catégories

**Endpoint** : `PATCH /products/:productId/categories`

**Body** :
```json
{
  "categoryIds": [2, 5, 8]
}
```

**Response** :
```json
{
  "success": true,
  "message": "Catégories du produit mises à jour avec succès",
  "data": {
    "id": 10,
    "name": "T-Shirt Premium",
    "categories": [
      { "id": 2, "name": "Vêtements" },
      { "id": 5, "name": "T-Shirts" },
      { "id": 8, "name": "Coton Bio" }
    ]
  }
}
```

**Code Backend** (`product.service.ts`) :
```typescript
async updateProductCategories(productId: number, categoryIds: number[]) {
    // Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
        where: { id: productId }
    });

    if (!product) {
        throw new NotFoundException(`Produit avec ID ${productId} non trouvé`);
    }

    // Vérifier que toutes les catégories existent
    const categories = await this.prisma.category.findMany({
        where: { id: { in: categoryIds } }
    });

    if (categories.length !== categoryIds.length) {
        throw new BadRequestException('Une ou plusieurs catégories sont invalides');
    }

    // Mettre à jour les catégories du produit
    const updatedProduct = await this.prisma.product.update({
        where: { id: productId },
        data: {
            categories: {
                set: categoryIds.map(id => ({ id }))
            }
        },
        include: {
            categories: true
        }
    });

    return {
        success: true,
        message: 'Catégories du produit mises à jour avec succès',
        data: updatedProduct
    };
}
```

---

## 🎨 Frontend - Intégration

### 1. Interface de Modification de Catégorie

```typescript
import React, { useState } from 'react';
import axios from 'axios';

interface CategoryEditFormProps {
  category: {
    id: number;
    name: string;
    description: string;
    productCount: number;
  };
  onSuccess: () => void;
}

const CategoryEditForm: React.FC<CategoryEditFormProps> = ({ category, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.patch(
        `http://localhost:3000/categories/${category.id}`,
        formData
      );

      // ✅ Afficher le message de synchronisation
      setMessage(response.data.message); // "Catégorie mise à jour avec succès (5 produit(s) synchronisé(s))"

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      if (error.response?.data?.error === 'DUPLICATE_CATEGORY') {
        setMessage(`Erreur: ${error.response.data.message}`);
      } else {
        setMessage('Erreur lors de la mise à jour');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nom de la catégorie</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded"
          rows={3}
        />
      </div>

      {category.productCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ Cette catégorie est liée à {category.productCount} produit(s).
            Tous seront automatiquement mis à jour.
          </p>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded ${message.includes('Erreur') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Mise à jour...' : 'Mettre à jour'}
      </button>
    </form>
  );
};

export default CategoryEditForm;
```

---

### 2. Interface de Suppression de Catégorie

```typescript
import React, { useState } from 'react';
import axios from 'axios';

interface CategoryDeleteButtonProps {
  category: {
    id: number;
    name: string;
    productCount: number;
  };
  onSuccess: () => void;
}

const CategoryDeleteButton: React.FC<CategoryDeleteButtonProps> = ({ category, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.delete(`http://localhost:3000/categories/${category.id}`);
      onSuccess();
    } catch (error: any) {
      if (error.response?.status === 400) {
        // 🚫 Contrainte de suppression
        setError(error.response.data.message);
      } else {
        setError('Erreur lors de la suppression');
      }
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  // Si la catégorie a des produits, bloquer la suppression
  if (category.productCount > 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-3">
        <p className="text-sm text-red-800">
          🚫 Impossible de supprimer cette catégorie car elle est liée à {category.productCount} produit(s).
        </p>
        <p className="text-xs text-red-600 mt-1">
          Veuillez d'abord déplacer les produits vers une autre catégorie.
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Supprimer
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirmer la suppression</h3>
            <p className="mb-4">
              Êtes-vous sûr de vouloir supprimer la catégorie "{category.name}" ?
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryDeleteButton;
```

---

### 3. Interface de Déplacement de Produits

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ProductCategoryMoverProps {
  product: {
    id: number;
    name: string;
    categories: { id: number; name: string }[];
  };
  onSuccess: () => void;
}

const ProductCategoryMover: React.FC<ProductCategoryMoverProps> = ({ product, onSuccess }) => {
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    product.categories.map(c => c.id)
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/categories/hierarchy');
      setAllCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories', error);
    }
  };

  const handleToggleCategory = (categoryId: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCategoryIds.length === 0) {
      setMessage('Veuillez sélectionner au moins une catégorie');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.patch(
        `http://localhost:3000/products/${product.id}/categories`,
        { categoryIds: selectedCategoryIds }
      );

      setMessage(response.data.message);

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Erreur lors du déplacement');
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryTree = (categories: any[], level = 0) => {
    return categories.map(category => (
      <div key={category.id} style={{ marginLeft: `${level * 20}px` }}>
        <label className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            checked={selectedCategoryIds.includes(category.id)}
            onChange={() => handleToggleCategory(category.id)}
            className="w-4 h-4"
          />
          <span>{category.name}</span>
          {category.productCount > 0 && (
            <span className="text-xs text-gray-500">({category.productCount})</span>
          )}
        </label>
        {category.subcategories && category.subcategories.length > 0 && (
          <div>
            {renderCategoryTree(category.subcategories, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">Produit : {product.name}</h3>
        <p className="text-sm text-gray-600 mb-4">
          Catégories actuelles : {product.categories.map(c => c.name).join(', ')}
        </p>
      </div>

      <div className="border rounded p-3 max-h-96 overflow-y-auto">
        <p className="font-medium mb-2">Sélectionner les nouvelles catégories :</p>
        {renderCategoryTree(allCategories)}
      </div>

      {message && (
        <div className={`p-3 rounded ${message.includes('Erreur') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || selectedCategoryIds.length === 0}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Déplacement...' : 'Déplacer le produit'}
      </button>
    </form>
  );
};

export default ProductCategoryMover;
```

---

## 🧪 Scénarios de Test

### Scénario 1 : Modification de Catégorie avec Synchronisation

1. **Créer une catégorie** "Téléphone"
2. **Créer 5 produits mockup** liés à "Téléphone"
3. **Modifier le nom** de "Téléphone" → "Smartphones"
4. **Vérifier** que tous les produits affichent "Smartphones"
5. **Backend log** : `🔄 Synchronisation: 5 produit(s) liés à la catégorie "Téléphone" → "Smartphones"`

### Scénario 2 : Tentative de Suppression Bloquée

1. **Créer une catégorie** "Vêtements"
2. **Créer 3 produits mockup** liés à "Vêtements"
3. **Tenter de supprimer** la catégorie "Vêtements"
4. **Résultat attendu** : Erreur 400 - "Impossible de supprimer la catégorie car elle est liée à 3 produit(s)"

### Scénario 3 : Déplacement puis Suppression

1. **Créer deux catégories** : "T-Shirts" et "Polos"
2. **Créer 5 produits** liés à "T-Shirts"
3. **Déplacer les 5 produits** vers "Polos"
4. **Supprimer** la catégorie "T-Shirts" (maintenant vide)
5. **Résultat attendu** : Suppression réussie

### Scénario 4 : Hiérarchie en Cascade

1. **Créer structure** : Téléphone > Coque > iPhone 13
2. **Créer 2 produits** liés à "iPhone 13"
3. **Tenter de supprimer** "Téléphone" (parent)
4. **Résultat attendu** : Erreur - "Impossible de supprimer car ses sous-catégories sont liées à 2 produit(s)"

---

## 📊 Diagramme de Flux

```
┌─────────────────────────────────────────────────────────────┐
│                    GESTION DES CATÉGORIES                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │  Admin modifie catégorie │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Backend: PATCH /categories/:id │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Vérifier doublon nom     │
                 └─────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                 [Doublon]           [Pas de doublon]
                    │                   │
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐
         │ Retour erreur 409│  │ Mettre à jour DB │
         └──────────────────┘  └──────────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │ Compter produits liés  │
                           └────────────────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │ 🔄 Synchronisation auto │
                           │ (via Prisma relation)  │
                           └────────────────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │ Retour succès + count  │
                           └────────────────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │ Frontend: Afficher msg │
                           │ "5 produit(s) sync"    │
                           └────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  SUPPRESSION DE CATÉGORIE                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Admin tente suppression │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Backend: DELETE /categories/:id │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Récupérer enfants (récursif) │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Compter produits liés   │
                 │ (catégorie + enfants)   │
                 └─────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              [Produits liés]     [Aucun produit]
                    │                   │
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐
         │ 🚫 Retour erreur │  │ Supprimer catégorie │
         │ 400 Bad Request  │  │ + enfants (cascade) │
         └──────────────────┘  └──────────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │ Retour succès + count  │
                           └────────────────────────┘
```

---

## 🎯 Points Clés à Retenir

### ✅ Synchronisation Automatique
- **Prisma gère tout** via la relation many-to-many `_CategoryToProduct`
- Aucune migration de données manuelle nécessaire
- Les produits reflètent instantanément les changements de catégorie

### 🚫 Contraintes de Suppression
- **Vérification récursive** : vérifie la catégorie ET tous ses enfants
- **Message clair** : indique combien de produits bloquent la suppression
- **Solution** : déplacer les produits avant suppression

### 🔄 Workflow Complet
1. Admin modifie catégorie → Backend synchronise → Frontend affiche message
2. Admin tente suppression → Backend vérifie produits → Bloque ou autorise
3. Admin déplace produits → Backend met à jour relations → Suppression possible

---

## 📝 Endpoints Résumés

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/categories` | Créer catégorie |
| `GET` | `/categories` | Lister toutes les catégories |
| `GET` | `/categories/hierarchy` | Arbre hiérarchique |
| `GET` | `/categories/:id` | Détails d'une catégorie |
| `PATCH` | `/categories/:id` | **Modifier catégorie (sync auto)** |
| `DELETE` | `/categories/:id` | **Supprimer (avec contrainte)** |
| `PATCH` | `/products/:id/categories` | **Déplacer produit** |

---

## 🚀 Conclusion

Ce système sophistiqué assure :
- ✅ **Intégrité des données** : Les produits restent toujours synchronisés
- ✅ **Sécurité** : Impossible de supprimer accidentellement des catégories utilisées
- ✅ **Transparence** : Messages clairs indiquant le nombre de produits affectés
- ✅ **Flexibilité** : Déplacement facile des produits entre catégories

Le tout est géré **automatiquement par Prisma** avec un minimum de code backend ! 🎉
