# 🎯 Guide Frontend - Enregistrement des Sous-Catégories et Variations

**Date**: 2025-10-13
**Problème résolu**: Le frontend n'enregistre que les catégories principales, pas les sous-catégories ni les variations
**Statut**: ✅ Solution complète avec exemples

---

## 📋 Table des matières

1. [Diagnostic du problème](#diagnostic-du-problème)
2. [Architecture à 3 niveaux](#architecture-à-3-niveaux)
3. [Endpoints API disponibles](#endpoints-api-disponibles)
4. [Solution Step-by-Step](#solution-step-by-step)
5. [Code complet Frontend](#code-complet-frontend)
6. [Tests et validation](#tests-et-validation)
7. [Troubleshooting](#troubleshooting)

---

## 🔍 Diagnostic du problème

### Symptôme
Le frontend enregistre uniquement les **Catégories** (Niveau 0) mais pas les **Sous-Catégories** (Niveau 1) ni les **Variations** (Niveau 2).

### Cause probable
Le formulaire frontend envoie seulement `categoryId` au backend, sans inclure `subCategoryId` et `variationId`.

### Exemple de requête incorrecte ❌
```json
{
  "name": "T-shirt Premium",
  "description": "...",
  "price": 2500,
  "categoryId": 1,
  // ❌ MANQUANT: subCategoryId et variationId
  "colorVariations": [...]
}
```

### Exemple de requête correcte ✅
```json
{
  "name": "T-shirt Premium",
  "description": "...",
  "price": 2500,
  "categoryId": 1,           // ✅ Catégorie principale
  "subCategoryId": 5,        // ✅ Sous-catégorie
  "variationId": 12,         // ✅ Variation
  "colorVariations": [...]
}
```

---

## 🏗️ Architecture à 3 niveaux

### Schéma de la base de données

```
┌─────────────────┐
│    Category     │ Niveau 0 - Catégorie principale
│   (Vêtements)   │
└────────┬────────┘
         │
         │ categoryId (FK)
         ▼
┌─────────────────┐
│  SubCategory    │ Niveau 1 - Sous-catégorie
│   (T-Shirts)    │
└────────┬────────┘
         │
         │ subCategoryId (FK)
         ▼
┌─────────────────┐
│   Variation     │ Niveau 2 - Variation
│    (Col V)      │
└─────────────────┘
         │
         │ TOUS LES 3 FK dans Product
         ▼
┌─────────────────────────────┐
│         Product             │
│  categoryId: 1              │
│  subCategoryId: 5           │
│  variationId: 12            │
└─────────────────────────────┘
```

### Relations dans Prisma

```prisma
model Product {
  id            Int      @id @default(autoincrement())
  name          String

  // 🔑 Les 3 Foreign Keys nécessaires
  categoryId    Int?     @map("category_id")
  subCategoryId Int?     @map("sub_category_id")
  variationId   Int?     @map("variation_id")

  // 📦 Relations chargées avec include
  category      Category?    @relation("ProductMainCategory", fields: [categoryId], references: [id])
  subCategory   SubCategory? @relation("ProductSubCategory", fields: [subCategoryId], references: [id])
  variation     Variation?   @relation("ProductVariation", fields: [variationId], references: [id])
}

model Category {
  id            Int      @id
  name          String   @unique
  slug          String   @unique
  // ...
  subCategories SubCategory[]  // Relation 1-N
  products      Product[]      // Relation 1-N
}

model SubCategory {
  id         Int      @id
  name       String
  slug       String
  categoryId Int      @map("category_id")  // 🔑 FK vers Category
  // ...
  category   Category   @relation(fields: [categoryId], references: [id])
  variations Variation[] // Relation 1-N
  products   Product[]   // Relation 1-N
}

model Variation {
  id            Int      @id
  name          String
  slug          String
  subCategoryId Int      @map("sub_category_id")  // 🔑 FK vers SubCategory
  // ...
  subCategory SubCategory @relation(fields: [subCategoryId], references: [id])
  products    Product[]   // Relation 1-N
}
```

---

## 🔌 Endpoints API disponibles

### 1. Créer une catégorie principale

**POST** `/categories`

```typescript
// Request Body
{
  "name": "Vêtements",
  "description": "Tous les vêtements personnalisables",
  "displayOrder": 0,
  "coverImageUrl": "https://...",
  "coverImagePublicId": "..."
}

// Response
{
  "success": true,
  "message": "Catégorie créée avec succès",
  "data": {
    "id": 1,
    "name": "Vêtements",
    "slug": "vetements",
    "description": "Tous les vêtements personnalisables",
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "2025-10-13T10:00:00Z",
    "updatedAt": "2025-10-13T10:00:00Z"
  }
}
```

### 2. Créer une sous-catégorie (NON DISPONIBLE - À IMPLÉMENTER)

⚠️ **IMPORTANT**: L'endpoint pour créer des sous-catégories n'existe pas encore côté backend!

**Endpoint attendu**: `POST /sub-categories`

**Requête attendue**:
```typescript
{
  "name": "T-Shirts",
  "description": "T-shirts pour homme et femme",
  "categoryId": 1,           // 🔑 FK vers Category
  "displayOrder": 0
}
```

**Réponse attendue**:
```typescript
{
  "success": true,
  "message": "Sous-catégorie créée avec succès",
  "data": {
    "id": 5,
    "name": "T-Shirts",
    "slug": "t-shirts",
    "categoryId": 1,
    "displayOrder": 0,
    "isActive": true
  }
}
```

### 3. Créer une variation (NON DISPONIBLE - À IMPLÉMENTER)

⚠️ **IMPORTANT**: L'endpoint pour créer des variations n'existe pas encore côté backend!

**Endpoint attendu**: `POST /variations`

**Requête attendue**:
```typescript
{
  "name": "Col V",
  "description": "T-shirt avec col en V",
  "subCategoryId": 5,        // 🔑 FK vers SubCategory
  "displayOrder": 0
}
```

**Réponse attendue**:
```typescript
{
  "success": true,
  "message": "Variation créée avec succès",
  "data": {
    "id": 12,
    "name": "Col V",
    "slug": "col-v",
    "subCategoryId": 5,
    "displayOrder": 0,
    "isActive": true
  }
}
```

### 4. Lister toutes les catégories

**GET** `/categories`

```typescript
// Response
[
  {
    "id": 1,
    "name": "Vêtements",
    "slug": "vetements",
    "displayOrder": 0,
    "isActive": true
  },
  {
    "id": 2,
    "name": "Accessoires",
    "slug": "accessoires",
    "displayOrder": 1,
    "isActive": true
  }
]
```

### 5. Lister les sous-catégories d'une catégorie (NON DISPONIBLE)

**Endpoint attendu**: `GET /sub-categories?categoryId=1`

```typescript
// Response attendue
[
  {
    "id": 5,
    "name": "T-Shirts",
    "slug": "t-shirts",
    "categoryId": 1,
    "displayOrder": 0
  },
  {
    "id": 6,
    "name": "Sweats",
    "slug": "sweats",
    "categoryId": 1,
    "displayOrder": 1
  }
]
```

### 6. Lister les variations d'une sous-catégorie (NON DISPONIBLE)

**Endpoint attendu**: `GET /variations?subCategoryId=5`

```typescript
// Response attendue
[
  {
    "id": 12,
    "name": "Col V",
    "slug": "col-v",
    "subCategoryId": 5,
    "displayOrder": 0
  },
  {
    "id": 13,
    "name": "Col Rond",
    "slug": "col-rond",
    "subCategoryId": 5,
    "displayOrder": 1
  }
]
```

---

## 🛠️ Solution Step-by-Step

### Étape 1: Créer le controller backend pour SubCategory  

**Fichier**: `src/sub-category/sub-category.controller.ts`

```typescript
import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { SubCategoryService } from './sub-category.service';

@ApiTags('SubCategories')
@Controller('sub-categories')
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une sous-catégorie' })
  @ApiResponse({ status: 201, description: 'Sous-catégorie créée avec succès' })
  async create(@Body() dto: CreateSubCategoryDto) {
    return this.subCategoryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les sous-catégories' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  async findAll(@Query('categoryId', ParseIntPipe) categoryId?: number) {
    return this.subCategoryService.findAll(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une sous-catégorie par ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subCategoryService.findOne(id);
  }
}
```

### Étape 2: Créer le service backend pour SubCategory

**Fichier**: `src/sub-category/sub-category.service.ts`

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';

@Injectable()
export class SubCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubCategoryDto) {
    // Vérifier que la catégorie parente existe
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId }
    });

    if (!category) {
      throw new NotFoundException(`Catégorie avec ID ${dto.categoryId} non trouvée`);
    }

    // Vérifier que la sous-catégorie n'existe pas déjà
    const existing = await this.prisma.subCategory.findFirst({
      where: {
        name: dto.name.trim(),
        categoryId: dto.categoryId
      }
    });

    if (existing) {
      throw new ConflictException(
        `La sous-catégorie "${dto.name}" existe déjà dans cette catégorie`
      );
    }

    // Générer le slug
    const slug = dto.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Créer la sous-catégorie
    const subCategory = await this.prisma.subCategory.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || '',
        categoryId: dto.categoryId,
        displayOrder: dto.displayOrder || 0
      },
      include: {
        category: true
      }
    });

    return {
      success: true,
      message: 'Sous-catégorie créée avec succès',
      data: subCategory
    };
  }

  async findAll(categoryId?: number) {
    const where = categoryId ? { categoryId, isActive: true } : { isActive: true };

    const subCategories = await this.prisma.subCategory.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { variations: true }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return subCategories;
  }

  async findOne(id: number) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id },
      include: {
        category: true,
        variations: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!subCategory) {
      throw new NotFoundException(`Sous-catégorie avec ID ${id} non trouvée`);
    }

    return subCategory;
  }
}
```

### Étape 3: Créer le DTO

**Fichier**: `src/sub-category/dto/create-sub-category.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateSubCategoryDto {
  @ApiProperty({ description: 'Nom de la sous-catégorie', example: 'T-Shirts' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description de la sous-catégorie',
    example: 'T-shirts pour homme et femme',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'ID de la catégorie parente', example: 1 })
  @IsInt()
  categoryId: number;

  @ApiProperty({
    description: 'Ordre d\'affichage',
    example: 0,
    required: false
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
```

### Étape 4: Créer le controller et service pour Variation

**Répéter les étapes 1-3 pour les variations** en remplaçant:
- `SubCategory` → `Variation`
- `categoryId` → `subCategoryId`
- Fichiers: `src/variation/variation.controller.ts`, `variation.service.ts`, `dto/create-variation.dto.ts`

---

## 💻 Code complet Frontend

### 1. Interface TypeScript

```typescript
// types/category.types.ts

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  coverImageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  categoryId: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface Variation {
  id: number;
  name: string;
  slug: string;
  description: string;
  subCategoryId: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subCategory?: SubCategory;
}

export interface CategoryFormData {
  categoryId: number | null;
  subCategoryId: number | null;
  variationId: number | null;
}
```

### 2. Composant de sélection hiérarchique

```typescript
// components/CategoryHierarchySelector.tsx
import React, { useState, useEffect } from 'react';
import { Category, SubCategory, Variation, CategoryFormData } from '../types/category.types';

interface Props {
  value: CategoryFormData;
  onChange: (value: CategoryFormData) => void;
  required?: boolean;
}

export function CategoryHierarchySelector({ value, onChange, required = false }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);

  const [loading, setLoading] = useState({
    categories: false,
    subCategories: false,
    variations: false
  });

  // Charger les catégories principales au montage
  useEffect(() => {
    loadCategories();
  }, []);

  // Charger les sous-catégories quand categoryId change
  useEffect(() => {
    if (value.categoryId) {
      loadSubCategories(value.categoryId);
    } else {
      setSubCategories([]);
      setVariations([]);
    }
  }, [value.categoryId]);

  // Charger les variations quand subCategoryId change
  useEffect(() => {
    if (value.subCategoryId) {
      loadVariations(value.subCategoryId);
    } else {
      setVariations([]);
    }
  }, [value.subCategoryId]);

  const loadCategories = async () => {
    setLoading(prev => ({ ...prev, categories: true }));
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const loadSubCategories = async (categoryId: number) => {
    setLoading(prev => ({ ...prev, subCategories: true }));
    try {
      const response = await fetch(`/api/sub-categories?categoryId=${categoryId}`);
      const data = await response.json();
      setSubCategories(data);
    } catch (error) {
      console.error('Erreur chargement sous-catégories:', error);
      setSubCategories([]);
    } finally {
      setLoading(prev => ({ ...prev, subCategories: false }));
    }
  };

  const loadVariations = async (subCategoryId: number) => {
    setLoading(prev => ({ ...prev, variations: true }));
    try {
      const response = await fetch(`/api/variations?subCategoryId=${subCategoryId}`);
      const data = await response.json();
      setVariations(data);
    } catch (error) {
      console.error('Erreur chargement variations:', error);
      setVariations([]);
    } finally {
      setLoading(prev => ({ ...prev, variations: false }));
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    onChange({
      categoryId: categoryId ? Number(categoryId) : null,
      subCategoryId: null,
      variationId: null
    });
  };

  const handleSubCategoryChange = (subCategoryId: string) => {
    onChange({
      ...value,
      subCategoryId: subCategoryId ? Number(subCategoryId) : null,
      variationId: null
    });
  };

  const handleVariationChange = (variationId: string) => {
    onChange({
      ...value,
      variationId: variationId ? Number(variationId) : null
    });
  };

  return (
    <div className="category-hierarchy-selector">
      {/* Catégorie principale */}
      <div className="form-group">
        <label htmlFor="category">
          Catégorie principale {required && <span className="required">*</span>}
        </label>
        <select
          id="category"
          value={value.categoryId || ''}
          onChange={(e) => handleCategoryChange(e.target.value)}
          disabled={loading.categories}
          required={required}
          className="form-control"
        >
          <option value="">-- Sélectionner une catégorie --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {loading.categories && <span className="loading-indicator">Chargement...</span>}
      </div>

      {/* Sous-catégorie (conditionnelle) */}
      {value.categoryId && (
        <div className="form-group">
          <label htmlFor="subCategory">
            Sous-catégorie
          </label>
          <select
            id="subCategory"
            value={value.subCategoryId || ''}
            onChange={(e) => handleSubCategoryChange(e.target.value)}
            disabled={loading.subCategories || subCategories.length === 0}
            className="form-control"
          >
            <option value="">-- Sélectionner une sous-catégorie (optionnel) --</option>
            {subCategories.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
          {loading.subCategories && <span className="loading-indicator">Chargement...</span>}
          {!loading.subCategories && subCategories.length === 0 && (
            <small className="text-muted">Aucune sous-catégorie disponible</small>
          )}
        </div>
      )}

      {/* Variation (conditionnelle) */}
      {value.subCategoryId && (
        <div className="form-group">
          <label htmlFor="variation">
            Variation
          </label>
          <select
            id="variation"
            value={value.variationId || ''}
            onChange={(e) => handleVariationChange(e.target.value)}
            disabled={loading.variations || variations.length === 0}
            className="form-control"
          >
            <option value="">-- Sélectionner une variation (optionnel) --</option>
            {variations.map(variant => (
              <option key={variant.id} value={variant.id}>
                {variant.name}
              </option>
            ))}
          </select>
          {loading.variations && <span className="loading-indicator">Chargement...</span>}
          {!loading.variations && variations.length === 0 && (
            <small className="text-muted">Aucune variation disponible</small>
          )}
        </div>
      )}

      {/* Résumé de la sélection */}
      {value.categoryId && (
        <div className="selection-summary">
          <h4>Sélection actuelle:</h4>
          <ul>
            <li>
              <strong>Catégorie:</strong>{' '}
              {categories.find(c => c.id === value.categoryId)?.name || 'Non trouvée'}
            </li>
            {value.subCategoryId && (
              <li>
                <strong>Sous-catégorie:</strong>{' '}
                {subCategories.find(s => s.id === value.subCategoryId)?.name || 'Non trouvée'}
              </li>
            )}
            {value.variationId && (
              <li>
                <strong>Variation:</strong>{' '}
                {variations.find(v => v.id === value.variationId)?.name || 'Non trouvée'}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### 3. Utilisation dans un formulaire de produit

```typescript
// components/ProductForm.tsx
import React, { useState } from 'react';
import { CategoryHierarchySelector } from './CategoryHierarchySelector';
import { CategoryFormData } from '../types/category.types';

export function ProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    // ... autres champs
  });

  const [categories, setCategories] = useState<CategoryFormData>({
    categoryId: null,
    subCategoryId: null,
    variationId: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Construire le payload
    const productData = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
      // 🔑 IMPORTANT: Inclure les 3 IDs
      categoryId: categories.categoryId,
      subCategoryId: categories.subCategoryId,
      variationId: categories.variationId,
      // ... autres champs
    };

    // Préparer FormData pour l'envoi multipart
    const formDataToSend = new FormData();
    formDataToSend.append('productData', JSON.stringify(productData));

    // Ajouter les fichiers...
    // formDataToSend.append('files', file);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création du produit');
      }

      const result = await response.json();
      console.log('✅ Produit créé avec succès:', result);

      // Redirection ou notification de succès
      alert('Produit créé avec succès!');
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Créer un produit</h2>

      {/* Champs basiques */}
      <div className="form-group">
        <label>Nom du produit *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label>Prix (en centimes) *</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
          required
          min={0}
          className="form-control"
        />
      </div>

      {/* 🎯 Sélecteur hiérarchique de catégories */}
      <CategoryHierarchySelector
        value={categories}
        onChange={setCategories}
        required={true}
      />

      {/* Bouton de soumission */}
      <button type="submit" className="btn btn-primary">
        Créer le produit
      </button>
    </form>
  );
}
```

### 4. Service API (optionnel mais recommandé)

```typescript
// services/categoryApi.ts

export const categoryApi = {
  // Catégories
  async getCategories(): Promise<Category[]> {
    const response = await fetch('/api/categories');
    if (!response.ok) throw new Error('Erreur chargement catégories');
    return response.json();
  },

  async createCategory(data: { name: string; description?: string }): Promise<Category> {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur création catégorie');
    const result = await response.json();
    return result.data;
  },

  // Sous-catégories
  async getSubCategories(categoryId?: number): Promise<SubCategory[]> {
    const url = categoryId
      ? `/api/sub-categories?categoryId=${categoryId}`
      : '/api/sub-categories';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur chargement sous-catégories');
    return response.json();
  },

  async createSubCategory(data: {
    name: string;
    categoryId: number;
    description?: string;
  }): Promise<SubCategory> {
    const response = await fetch('/api/sub-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur création sous-catégorie');
    const result = await response.json();
    return result.data;
  },

  // Variations
  async getVariations(subCategoryId?: number): Promise<Variation[]> {
    const url = subCategoryId
      ? `/api/variations?subCategoryId=${subCategoryId}`
      : '/api/variations';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur chargement variations');
    return response.json();
  },

  async createVariation(data: {
    name: string;
    subCategoryId: number;
    description?: string;
  }): Promise<Variation> {
    const response = await fetch('/api/variations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erreur création variation');
    const result = await response.json();
    return result.data;
  }
};
```

---

## ✅ Tests et validation

### 1. Test manuel du sélecteur

**Scénario de test:**

1. ✅ Charger la page avec le formulaire
2. ✅ Vérifier que les catégories se chargent
3. ✅ Sélectionner "Vêtements"
4. ✅ Vérifier que les sous-catégories apparaissent
5. ✅ Sélectionner "T-Shirts"
6. ✅ Vérifier que les variations apparaissent
7. ✅ Sélectionner "Col V"
8. ✅ Soumettre le formulaire
9. ✅ Vérifier que le produit est créé avec les 3 IDs

### 2. Vérification dans la base de données

```sql
-- Vérifier qu'un produit a bien les 3 FK
SELECT
  id,
  name,
  category_id,
  sub_category_id,
  variation_id
FROM products
WHERE id = 123;

-- Résultat attendu:
-- id | name            | category_id | sub_category_id | variation_id
-- 123| T-shirt Premium | 1           | 5               | 12
```

### 3. Test de l'API avec curl

```bash
# Créer un produit avec les 3 niveaux
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: multipart/form-data" \
  -F 'productData={
    "name": "T-shirt Test",
    "description": "Description test",
    "price": 2500,
    "categoryId": 1,
    "subCategoryId": 5,
    "variationId": 12
  }' \
  -F 'file=@image.jpg'
```

---

## 🐛 Troubleshooting

### Problème 1: Les sous-catégories ne s'affichent pas

**Symptôme:** Le select des sous-catégories reste vide après sélection de la catégorie

**Solutions:**
1. Vérifier que l'endpoint `/sub-categories?categoryId=X` existe
2. Vérifier les logs de la console pour les erreurs réseau
3. Vérifier que des sous-catégories existent dans la BDD pour cette catégorie

```sql
-- Vérifier les sous-catégories existantes
SELECT * FROM sub_categories WHERE category_id = 1;
```

### Problème 2: Erreur 404 sur `/sub-categories`

**Cause:** L'endpoint n'a pas été créé côté backend

**Solution:** Implémenter le controller et service SubCategory (voir Étapes 1-3)

### Problème 3: Le produit est créé sans subCategoryId ni variationId

**Symptôme:** En BDD, `sub_category_id` et `variation_id` sont NULL

**Cause probable:** Les valeurs ne sont pas envoyées dans la requête

**Solution:**
```typescript
// Vérifier le payload avant envoi
console.log('📤 Payload envoyé:', productData);

// S'assurer que les IDs sont présents
if (categories.subCategoryId) {
  productData.subCategoryId = categories.subCategoryId;
}
if (categories.variationId) {
  productData.variationId = categories.variationId;
}
```

### Problème 4: Les IDs sont envoyés comme strings

**Symptôme:** Erreur de validation "subCategoryId must be a number"

**Solution:** Convertir en nombres
```typescript
categoryId: categories.categoryId ? Number(categories.categoryId) : null,
subCategoryId: categories.subCategoryId ? Number(categories.subCategoryId) : null,
variationId: categories.variationId ? Number(categories.variationId) : null,
```

---

## 📚 Références

- **Guide principal**: `FRONTEND_CATEGORY_IMPLEMENTATION_GUIDE.md`
- **Schéma Prisma**: `prisma/schema.prisma` (lignes 187-259)
- **DTOs existants**: `src/category/dto/create-category.dto.ts`
- **Controller catégories**: `src/category/category.controller.ts`

---

## 🎯 Checklist finale

### Backend
- [ ] Créer `SubCategoryController` avec POST et GET
- [ ] Créer `SubCategoryService` avec create, findAll, findOne
- [ ] Créer `CreateSubCategoryDto`
- [ ] Créer `VariationController` avec POST et GET
- [ ] Créer `VariationService` avec create, findAll, findOne
- [ ] Créer `CreateVariationDto`
- [ ] Tester les endpoints avec Postman/Thunder Client

### Frontend
- [ ] Créer les interfaces TypeScript (Category, SubCategory, Variation)
- [ ] Créer le composant `CategoryHierarchySelector`
- [ ] Intégrer dans le formulaire de produit
- [ ] Ajouter la validation des champs obligatoires
- [ ] Tester le chargement cascadé
- [ ] Vérifier l'envoi des 3 IDs au backend
- [ ] Gérer les états de chargement
- [ ] Gérer les erreurs réseau

### Tests
- [ ] Test de création de produit avec 3 niveaux
- [ ] Test de création avec seulement category
- [ ] Test de création avec category + subCategory
- [ ] Vérifier en BDD que les FK sont bien enregistrées
- [ ] Test de modification de produit

---

**Résultat attendu:**

✅ Le frontend peut maintenant enregistrer correctement les 3 niveaux de catégorisation (Category → SubCategory → Variation) pour chaque produit!

