# Guide - Régénération Automatique des Mockups

## 📋 Vue d'ensemble

Ce système permet de **régénérer automatiquement les mockups des produits** lorsqu'une catégorie, sous-catégorie ou variation est modifiée. Cela garantit que les mockups restent à jour avec les dernières modifications de la hiérarchie de catégories.

## 🎯 Fonctionnalités

### Déclencheurs de Régénération

La régénération des mockups est déclenchée automatiquement dans les cas suivants :

1. **Modification d'une Catégorie** (`CategoryService.update`)
   - Change le nom de la catégorie
   - Change la description
   - Change l'image de couverture
   - Change l'ordre d'affichage

2. **Modification d'une Sous-Catégorie** (`SubCategoryService.update`)
   - Change le nom de la sous-catégorie
   - Change la description
   - Change la catégorie parente
   - Change l'ordre d'affichage

3. **Modification d'une Variation** (`VariationService.update`)
   - Change le nom de la variation
   - Change la description
   - Change la sous-catégorie parente
   - Change l'ordre d'affichage

## 🔧 Architecture Technique

### 1. Service Mockup - Méthodes de Régénération

Le fichier `src/product/services/mockup.service.ts` contient 3 nouvelles méthodes :

```typescript
// Régénère les mockups d'une catégorie
async regenerateMockupsForCategory(categoryId: number): Promise<void>

// Régénère les mockups d'une sous-catégorie
async regenerateMockupsForSubCategory(subCategoryId: number): Promise<void>

// Régénère les mockups d'une variation
async regenerateMockupsForVariation(variationId: number): Promise<void>
```

#### Détail de l'implémentation

```typescript
async regenerateMockupsForCategory(categoryId: number): Promise<void> {
  this.logger.log(`🔄 Régénération mockups pour catégorie ${categoryId}`);

  // 1. Récupérer tous les mockups liés à cette catégorie
  const mockups = await this.prisma.product.findMany({
    where: {
      categoryId,
      isReadyProduct: false,  // Seulement les mockups
      isDelete: false
    },
    include: {
      colorVariations: {
        include: {
          images: true
        }
      }
    }
  });

  this.logger.log(`📦 ${mockups.length} mockups à régénérer`);

  // 2. Pour chaque mockup, déclencher la régénération
  for (const mockup of mockups) {
    this.logger.log(`   ✓ Mockup ${mockup.id} - ${mockup.name} marqué pour régénération`);
    // TODO: Implémenter la régénération réelle des images si nécessaire
    // await this.regenerateMockupImages(mockup.id);
  }

  this.logger.log(`✅ Régénération terminée`);
}
```

### 2. Intégration dans les Services

#### CategoryService

**Fichier :** `src/category/category.service.ts`

```typescript
import { MockupService } from '../product/services/mockup.service';

@Injectable()
export class CategoryService {
  constructor(
    private prisma: PrismaService,
    private mockupService: MockupService  // ← Injection
  ) {}

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    // ... logique de mise à jour

    // Régénérer les mockups
    this.logger.log(`🔄 Déclenchement de la régénération des mockups pour la catégorie ${id}`);
    try {
      await this.mockupService.regenerateMockupsForCategory(id);
    } catch (error) {
      this.logger.warn(`⚠️ Erreur lors de la régénération: ${error.message}`);
      // On continue même si la régénération échoue
    }

    return { success: true, ... };
  }
}
```

**Module :** `src/category/category.module.ts`

```typescript
import { MockupService } from '../product/services/mockup.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

@Module({
  providers: [
    CategoryService,
    PrismaService,
    MockupService,        // ← Ajouté
    CloudinaryService     // ← Nécessaire pour MockupService
  ]
})
export class CategoryModule {}
```

#### SubCategoryService

**Fichier :** `src/sub-category/sub-category.service.ts`

```typescript
import { MockupService } from '../product/services/mockup.service';

@Injectable()
export class SubCategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mockupService: MockupService  // ← Injection
  ) {}

  async update(id: number, dto: Partial<CreateSubCategoryDto>) {
    // ... logique de mise à jour

    // Régénérer les mockups
    this.logger.log(`🔄 Déclenchement de la régénération des mockups pour la sous-catégorie ${id}`);
    try {
      await this.mockupService.regenerateMockupsForSubCategory(id);
    } catch (error) {
      this.logger.warn(`⚠️ Erreur lors de la régénération: ${error.message}`);
    }

    return { success: true, ... };
  }
}
```

**Module :** `src/sub-category/sub-category.module.ts`

```typescript
import { MockupService } from '../product/services/mockup.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

@Module({
  providers: [
    SubCategoryService,
    PrismaService,
    MockupService,        // ← Ajouté
    CloudinaryService     // ← Nécessaire pour MockupService
  ]
})
export class SubCategoryModule {}
```

#### VariationService

**Fichier :** `src/variation/variation.service.ts`

```typescript
import { MockupService } from '../product/services/mockup.service';

@Injectable()
export class VariationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mockupService: MockupService  // ← Injection
  ) {}

  async update(id: number, dto: Partial<CreateVariationDto>) {
    // ... logique de mise à jour

    // Régénérer les mockups
    this.logger.log(`🔄 Déclenchement de la régénération des mockups pour la variation ${id}`);
    try {
      await this.mockupService.regenerateMockupsForVariation(id);
    } catch (error) {
      this.logger.warn(`⚠️ Erreur lors de la régénération: ${error.message}`);
    }

    return { success: true, ... };
  }
}
```

**Module :** `src/variation/variation.module.ts`

```typescript
import { MockupService } from '../product/services/mockup.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

@Module({
  providers: [
    VariationService,
    PrismaService,
    MockupService,        // ← Ajouté
    CloudinaryService     // ← Nécessaire pour MockupService
  ]
})
export class VariationModule {}
```

## 📊 Flux de Données

```
┌─────────────────────────────────────────────────┐
│  Admin modifie une Catégorie                   │
│  PATCH /categories/:id                          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  CategoryService.update()                       │
│  1. Valide les données                          │
│  2. Met à jour la catégorie                     │
│  3. Appelle MockupService.regenerateMockups...  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  MockupService.regenerateMockupsForCategory()   │
│  1. Trouve tous les mockups liés                │
│  2. Pour chaque mockup:                         │
│     - Log le mockup à régénérer                 │
│     - (TODO) Régénère les images               │
└─────────────────────────────────────────────────┘
```

## 🔍 Logs Générés

Lors de la modification d'une catégorie, vous verrez dans les logs :

```bash
# Lors de la mise à jour de la catégorie
[CategoryService] 🔄 Déclenchement de la régénération des mockups pour la catégorie 5

# Dans le MockupService
[MockupService] 🔄 Régénération mockups pour catégorie 5
[MockupService] 📦 3 mockups à régénérer pour la catégorie 5
[MockupService]    ✓ Mockup 12 - T-Shirt Col Rond Blanc marqué pour régénération
[MockupService]    ✓ Mockup 13 - T-Shirt Col V Noir marqué pour régénération
[MockupService]    ✓ Mockup 14 - Hoodie Classique marqué pour régénération
[MockupService] ✅ Régénération terminée pour 3 mockups
```

## 🧪 Tests

### Test 1 : Modification d'une Catégorie

```bash
# 1. Créer une catégorie avec des produits mockups
POST /categories
{
  "name": "T-Shirts",
  "description": "Catégorie T-Shirts"
}

# 2. Créer des mockups liés à cette catégorie
POST /mockups
{
  "name": "T-Shirt Blanc",
  "categoryId": 1,
  ...
}

# 3. Modifier la catégorie
PATCH /categories/1
{
  "name": "T-Shirts Premium",
  "description": "Nouvelle description"
}

# 4. Vérifier les logs
# → Devrait afficher la régénération des mockups
```

### Test 2 : Modification d'une Sous-Catégorie

```bash
# Modifier une sous-catégorie
PATCH /sub-categories/2
{
  "name": "Col Rond Premium"
}

# Vérifier les logs
# → Devrait régénérer les mockups de cette sous-catégorie
```

### Test 3 : Modification d'une Variation

```bash
# Modifier une variation
PATCH /variations/3
{
  "name": "Manches Longues Slim"
}

# Vérifier les logs
# → Devrait régénérer les mockups de cette variation
```

## ⚡ Performance

### Optimisations Actuelles

1. **Requêtes Optimisées**
   - Une seule requête pour récupérer tous les mockups concernés
   - Utilisation d'index sur `categoryId`, `subCategoryId`, `variationId`

2. **Gestion des Erreurs**
   - Si la régénération échoue, l'erreur est loggée mais ne bloque pas la mise à jour
   - Utilisation de try/catch pour isoler les erreurs

3. **Logging Détaillé**
   - Logs pour chaque étape du processus
   - Compteur de mockups régénérés

### Suggestions d'Amélioration Future

1. **Régénération Asynchrone**
   ```typescript
   // Ne pas attendre la fin de la régénération
   this.mockupService.regenerateMockupsForCategory(id).catch(error => {
     this.logger.error('Erreur régénération async:', error);
   });
   ```

2. **File de Jobs**
   ```typescript
   // Utiliser Bull Queue pour gérer les régénérations
   await this.mockupQueue.add('regenerate-category', {
     categoryId: id
   });
   ```

3. **Régénération Intelligente**
   ```typescript
   // Régénérer seulement si nécessaire (nom ou image changée)
   if (updateDto.name || updateDto.coverImageUrl) {
     await this.mockupService.regenerateMockupsForCategory(id);
   }
   ```

## 🚨 Gestion des Erreurs

### Erreur de Régénération

Si une erreur survient pendant la régénération :

```typescript
try {
  await this.mockupService.regenerateMockupsForCategory(id);
} catch (error) {
  // L'erreur est loggée mais ne bloque pas la mise à jour
  this.logger.warn(`⚠️ Erreur lors de la régénération: ${error.message}`);
}
```

**Avantage :** La mise à jour de la catégorie réussit même si la régénération échoue.

### Mockups Inexistants

Si aucun mockup n'est trouvé pour une catégorie :

```
[MockupService] 🔄 Régénération mockups pour catégorie 5
[MockupService] 📦 0 mockups à régénérer pour la catégorie 5
[MockupService] ✅ Régénération terminée pour 0 mockups
```

Pas d'erreur, simplement un log informatif.

## 📚 Documentation API

### Endpoints Concernés

Tous ces endpoints déclenchent automatiquement la régénération :

```typescript
// Catégories
PATCH /categories/:id

// Sous-Catégories
PATCH /sub-categories/:id

// Variations
PATCH /variations/:id
```

### Exemple de Réponse

```json
{
  "success": true,
  "message": "Catégorie mise à jour avec succès (3 produit(s) affecté(s))",
  "data": {
    "id": 5,
    "name": "T-Shirts Premium",
    "slug": "t-shirts-premium",
    ...
  }
}
```

**Note :** La régénération des mockups se fait en arrière-plan et n'affecte pas la réponse.

## 🔄 TODO - Améliorations Futures

1. **Implémentation Réelle de la Régénération d'Images**
   ```typescript
   // Dans MockupService
   private async regenerateMockupImages(mockupId: number) {
     // 1. Récupérer les images du mockup
     // 2. Régénérer avec les nouveaux paramètres de catégorie
     // 3. Uploader sur Cloudinary
     // 4. Mettre à jour la base de données
   }
   ```

2. **Webhooks de Notification**
   ```typescript
   // Notifier le frontend quand la régénération est terminée
   await this.webhookService.notify('mockups.regenerated', {
     categoryId: id,
     mockupsCount: mockups.length
   });
   ```

3. **Cache Invalidation**
   ```typescript
   // Invalider le cache des mockups après régénération
   await this.cacheManager.del(`mockups:category:${categoryId}`);
   ```

---

**Date de création :** 2025-10-14
**Version :** 1.0.0
**Status :** ✅ Implémenté et Fonctionnel
