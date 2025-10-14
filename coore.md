# 🔧 Guide: Résoudre le Conflit de Sélection des Catégories

**Date**: 2025-10-13
**Problème**: Les variations dans `CategoriesAndSizesPanel.tsx` s'affichent correctement mais la sélection ne fonctionne pas
**Cause**: Conflit entre deux systèmes de catégories (ancien et nouveau)

---

## 🔍 Diagnostic du Problème

D'après les logs console (`rep.md`), voici ce qui se passe:

### ✅ Ce qui fonctionne:
```javascript
// Ligne 19-21: CategoriesAndSizesPanel.tsx charge correctement les données
✅ Tailles chargées depuis les noms de variations: ['fef', 'fefe', 'fzfz']
✅ Nouvelle sous-catégorie sélectionnée: Vêtements > Tshirt
✅ Variation ajoutée: fef
```

### ❌ Ce qui ne fonctionne pas:
```javascript
// Lignes 3-37: CategorySelector.tsx utilise l'ancien système
🔍 [CategorySelector] Rendering category: {
  id: 1,
  name: 'Catégorie par défaut',  // ❌ ANCIEN SYSTÈME
  level: 0
}
```

**Le problème**: Deux composants gèrent les catégories simultanément:
1. ✅ `CategoriesAndSizesPanel.tsx` - Utilise le nouveau système à 3 niveaux (Category → SubCategory → Variation)
2. ❌ `CategorySelector.tsx` - Utilise l'ancien système avec "Catégorie par défaut"

---

## 🎯 Solution: Supprimer l'Ancien Système

### Option 1: Désactiver CategorySelector (Recommandé)

Le composant `CategorySelector.tsx` doit être **retiré** du formulaire produit car `CategoriesAndSizesPanel.tsx` le remplace complètement.

**Fichier**: `src/components/product-form/ProductFormMain.tsx`

**Chercher et commenter/supprimer**:
```tsx
// ❌ À RETIRER OU COMMENTER
import { CategorySelector } from '../admin/CategorySelector';

// Dans le JSX, chercher:
<CategorySelector
  categories={allCategories}
  value={formData.categoryId}
  onChange={(categoryId) => updateFormData('categoryId', categoryId)}
  level={0}
  parentId={undefined}
/>
```

**Remplacer par**:
```tsx
// ✅ Utiliser uniquement CategoriesAndSizesPanel
<CategoriesAndSizesPanel
  categories={formData.categories || []}
  sizes={formData.sizes || []}
  onCategoriesUpdate={(cats) => updateFormData('categories', cats)}
  onSizesUpdate={(sizes) => updateFormData('sizes', sizes)}
/>
```

---

## 📊 Structure des Données Produit

### Ancien Format (à supprimer):
```typescript
// ❌ ANCIEN - Ne fonctionne plus avec le nouveau système
{
  categoryId: 1,  // ID de "Catégorie par défaut"
  categories: []  // Vide
}
```

### Nouveau Format (à utiliser):
```typescript
// ✅ NOUVEAU - Format à 3 niveaux
{
  // IDs séparés pour le backend
  categoryId: 4,        // Vêtements (niveau 0)
  subCategoryId: 4,     // Tshirt (niveau 1)
  variationId: 7,       // fef (niveau 2)

  // Format UI pour l'affichage
  categories: [
    "Vêtements > Tshirt > fef",
    "Vêtements > Tshirt > fefe",
    "Vêtements > Tshirt > fzfz"
  ]
}
```

---

## 🔧 Modifications Backend Requises

### 1. Schéma Prisma - Vérifier les Champs

**Fichier**: `prisma/schema.prisma`

```prisma
model Product {
  id             Int       @id @default(autoincrement())
  name           String
  description    String?
  price          Int

  // ✅ NOUVEAU: Relations avec le système à 3 niveaux
  categoryId     Int?
  category       Category? @relation(fields: [categoryId], references: [id])

  subCategoryId  Int?
  subCategory    SubCategory? @relation(fields: [subCategoryId], references: [id])

  variationId    Int?
  variation      Variation? @relation(fields: [variationId], references: [id])

  // Autres champs...
  sizes          String[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

**Migration à exécuter**:
```bash
# Si les champs n'existent pas encore
npx prisma migrate dev --name add_category_subcategory_variation_to_product
```

---

### 2. DTO Produit - Accepter les 3 IDs

**Fichier**: `src/products/dto/create-product.dto.ts` (Backend NestJS)

```typescript
import { IsInt, IsOptional, IsString, IsArray, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  price: number;

  // ✅ Les 3 IDs de la hiérarchie (tous optionnels)
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsInt()
  @IsOptional()
  subCategoryId?: number;

  @IsInt()
  @IsOptional()
  variationId?: number;

  // Tailles
  @IsArray()
  @IsOptional()
  sizes?: string[];

  // Autres champs...
}
```

---

### 3. Service Produit - Valider la Cohérence

**Fichier**: `src/products/products.service.ts` (Backend NestJS)

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // ✅ Valider la cohérence de la hiérarchie
    await this.validateCategoryHierarchy(
      createProductDto.categoryId,
      createProductDto.subCategoryId,
      createProductDto.variationId
    );

    // Créer le produit
    return this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        categoryId: createProductDto.categoryId,
        subCategoryId: createProductDto.subCategoryId,
        variationId: createProductDto.variationId,
        sizes: createProductDto.sizes || [],
        // ... autres champs
      },
      include: {
        category: true,
        subCategory: {
          include: {
            category: true
          }
        },
        variation: {
          include: {
            subCategory: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Valider que la hiérarchie Category → SubCategory → Variation est cohérente
   */
  private async validateCategoryHierarchy(
    categoryId?: number,
    subCategoryId?: number,
    variationId?: number
  ) {
    // Si une variation est fournie, vérifier qu'elle appartient à la sous-catégorie
    if (variationId && subCategoryId) {
      const variation = await this.prisma.variation.findUnique({
        where: { id: variationId },
        include: { subCategory: true }
      });

      if (!variation) {
        throw new BadRequestException(`Variation ${variationId} introuvable`);
      }

      if (variation.subCategoryId !== subCategoryId) {
        throw new BadRequestException(
          `La variation ${variationId} n'appartient pas à la sous-catégorie ${subCategoryId}`
        );
      }
    }

    // Si une sous-catégorie est fournie, vérifier qu'elle appartient à la catégorie
    if (subCategoryId && categoryId) {
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id: subCategoryId },
        include: { category: true }
      });

      if (!subCategory) {
        throw new BadRequestException(`Sous-catégorie ${subCategoryId} introuvable`);
      }

      if (subCategory.categoryId !== categoryId) {
        throw new BadRequestException(
          `La sous-catégorie ${subCategoryId} n'appartient pas à la catégorie ${categoryId}`
        );
      }
    }
  }
}
```

---

## 🔧 Modifications Frontend Requises

### 1. ProductFormMain.tsx - Extraire les IDs depuis la Sélection

**Problème actuel**: `CategoriesAndSizesPanel` stocke `categories: ["Vêtements > Tshirt > fef"]` mais le backend a besoin de `categoryId`, `subCategoryId`, `variationId`.

**Solution**: Ajouter une fonction pour extraire les IDs depuis les noms.

**Fichier**: `src/components/product-form/ProductFormMain.tsx`

```typescript
import categoryRealApi from '../../services/categoryRealApi';

/**
 * Convertir les catégories UI ["Parent > Child > Variation"]
 * en IDs séparés pour le backend
 */
const extractCategoryIds = async (categories: string[]) => {
  if (categories.length === 0) {
    return { categoryId: null, subCategoryId: null, variationId: null };
  }

  // Extraire les noms depuis le format "Parent > Child > Variation"
  const parts = categories[0].split(' > ');
  if (parts.length !== 3) {
    console.warn('⚠️ Format de catégorie invalide:', categories[0]);
    return { categoryId: null, subCategoryId: null, variationId: null };
  }

  const [categoryName, subCategoryName, variationName] = parts;

  try {
    // 1. Trouver la catégorie par nom
    const allCategories = await categoryRealApi.getCategories();
    const category = allCategories.find(c => c.name === categoryName);

    if (!category) {
      console.error('❌ Catégorie introuvable:', categoryName);
      return { categoryId: null, subCategoryId: null, variationId: null };
    }

    // 2. Trouver la sous-catégorie par nom
    const allSubCategories = await categoryRealApi.getSubCategories(category.id);
    const subCategory = allSubCategories.find(sc => sc.name === subCategoryName);

    if (!subCategory) {
      console.error('❌ Sous-catégorie introuvable:', subCategoryName);
      return { categoryId: category.id, subCategoryId: null, variationId: null };
    }

    // 3. Trouver la variation par nom
    const allVariations = await categoryRealApi.getVariations(subCategory.id);
    const variation = allVariations.find(v => v.name === variationName);

    if (!variation) {
      console.error('❌ Variation introuvable:', variationName);
      return { categoryId: category.id, subCategoryId: subCategory.id, variationId: null };
    }

    console.log('✅ IDs extraits:', {
      categoryId: category.id,
      subCategoryId: subCategory.id,
      variationId: variation.id
    });

    return {
      categoryId: category.id,
      subCategoryId: subCategory.id,
      variationId: variation.id
    };
  } catch (error) {
    console.error('❌ Erreur extraction IDs:', error);
    return { categoryId: null, subCategoryId: null, variationId: null };
  }
};
```

### 2. Utiliser extractCategoryIds lors de la Soumission

**Dans la fonction `handleSubmit` ou équivalent**:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // ✅ Extraire les IDs depuis les catégories UI
    const { categoryId, subCategoryId, variationId } =
      await extractCategoryIds(formData.categories || []);

    // Construire le payload pour le backend
    const payload = {
      name: formData.name,
      description: formData.description,
      price: formData.price,

      // ✅ Les 3 IDs de la hiérarchie
      categoryId,
      subCategoryId,
      variationId,

      // Tailles
      sizes: formData.sizes || [],

      // Autres champs...
    };

    console.log('📤 Payload envoyé au backend:', payload);

    // Envoyer au backend
    const response = await axios.post('/products', payload, {
      withCredentials: true
    });

    console.log('✅ Produit créé:', response.data);
    // Redirection ou notification...
  } catch (error) {
    console.error('❌ Erreur création produit:', error);
  } finally {
    setLoading(false);
  }
};
```

---

## 🧪 Tests Recommandés

### Test 1: Vérifier la Création de Produit avec 3 Niveaux

```bash
# 1. Créer une structure Category → SubCategory → Variation
curl -X POST http://localhost:3004/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Vêtements", "description": "Tous les vêtements"}'
# Response: {"data": {"id": 1, "name": "Vêtements", ...}}

curl -X POST http://localhost:3004/sub-categories \
  -H "Content-Type: application/json" \
  -d '{"name": "T-Shirts", "categoryId": 1}'
# Response: {"data": {"id": 1, "name": "T-Shirts", "categoryId": 1, ...}}

curl -X POST http://localhost:3004/variations \
  -H "Content-Type: application/json" \
  -d '{"name": "Col V", "subCategoryId": 1}'
# Response: {"data": {"id": 1, "name": "Col V", "subCategoryId": 1, ...}}

# 2. Créer un produit avec les 3 IDs
curl -X POST http://localhost:3004/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Premium Col V",
    "description": "T-shirt de qualité avec col en V",
    "price": 2500,
    "categoryId": 1,
    "subCategoryId": 1,
    "variationId": 1,
    "sizes": ["S", "M", "L", "XL"]
  }'

# Expected: Produit créé avec succès
# Response: {
#   "success": true,
#   "data": {
#     "id": 1,
#     "name": "T-shirt Premium Col V",
#     "categoryId": 1,
#     "subCategoryId": 1,
#     "variationId": 1,
#     "category": {"id": 1, "name": "Vêtements"},
#     "subCategory": {"id": 1, "name": "T-Shirts"},
#     "variation": {"id": 1, "name": "Col V"}
#   }
# }
```

### Test 2: Vérifier la Validation de Cohérence

```bash
# Tester avec des IDs incohérents (doit échouer)
curl -X POST http://localhost:3004/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "price": 1000,
    "categoryId": 1,
    "subCategoryId": 999,
    "variationId": 1
  }'

# Expected: 400 Bad Request
# Response: {
#   "statusCode": 400,
#   "message": "Sous-catégorie 999 introuvable"
# }
```

---

## 📋 Checklist de Migration

### Backend:
- [ ] Ajouter les champs `categoryId`, `subCategoryId`, `variationId` à la table `Product` (Prisma)
- [ ] Mettre à jour le DTO `CreateProductDto` pour accepter les 3 IDs
- [ ] Implémenter la validation de cohérence dans `ProductsService`
- [ ] Tester la création de produit avec les 3 IDs via curl/Postman

### Frontend:
- [ ] Retirer/commenter le composant `CategorySelector` dans `ProductFormMain.tsx`
- [ ] Ajouter la fonction `extractCategoryIds` dans `ProductFormMain.tsx`
- [ ] Mettre à jour `handleSubmit` pour extraire les IDs avant envoi
- [ ] Tester la sélection de catégories dans `CategoriesAndSizesPanel`
- [ ] Vérifier que les 3 IDs sont correctement envoyés au backend

### Tests:
- [ ] Créer une structure complète Category → SubCategory → Variation
- [ ] Sélectionner une variation dans le formulaire produit
- [ ] Vérifier les logs console pour voir les IDs extraits
- [ ] Créer un produit et vérifier qu'il a les bons IDs dans la base de données

---

## 🚨 Erreurs Fréquentes et Solutions

### Erreur 1: "categoryId must be a number"
**Cause**: Le frontend envoie une chaîne au lieu d'un nombre
**Solution**: Utiliser `parseInt()` ou s'assurer que `extractCategoryIds` retourne des nombres

### Erreur 2: "La variation X n'appartient pas à la sous-catégorie Y"
**Cause**: Incohérence dans la sélection (l'utilisateur a changé de sous-catégorie sans désélectionner les variations)
**Solution**: Ajouter un `useEffect` dans `CategoriesAndSizesPanel` qui reset les variations quand la sous-catégorie change

### Erreur 3: Les catégories ne s'affichent pas après migration
**Cause**: Ancienne donnée avec "Catégorie par défaut" toujours présente
**Solution**: Nettoyer la base de données et recréer les catégories via les nouveaux endpoints

---

## 📌 Résumé

**Problème**: Deux systèmes de catégories en conflit
**Solution**: Supprimer l'ancien `CategorySelector`, utiliser uniquement `CategoriesAndSizesPanel`
**Backend**: Accepter `categoryId`, `subCategoryId`, `variationId` avec validation de cohérence
**Frontend**: Extraire les IDs depuis le format UI avant envoi au backend

**Prochaine étape**: Implémenter les modifications backend dans l'ordre suivant:
1. Mise à jour du schéma Prisma
2. Migration de la base de données
3. Mise à jour du DTO et du service
4. Tests avec curl
5. Intégration frontend

---

**Créé par**: Claude Code
**Basé sur**: Logs `rep.md` + Analyse du conflit entre `CategorySelector.tsx` et `CategoriesAndSizesPanel.tsx`
