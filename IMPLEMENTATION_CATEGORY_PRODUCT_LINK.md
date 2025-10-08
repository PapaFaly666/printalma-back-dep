# Implémentation - Liaison Catégories ↔ Produits

## ✅ État Actuel du Schéma

Le schéma Prisma a déjà la relation many-to-many :

```prisma
model Category {
  products Product[] @relation("CategoryToProduct")
}

model Product {
  categories Category[] @relation("CategoryToProduct")
}
```

Cette relation crée automatiquement une table de liaison `_CategoryToProduct`.

## 🔧 Modifications Backend Nécessaires

### 1. DTO - Ajouter support categoryIds

```typescript
// src/product/dto/create-product.dto.ts

import { IsArray, IsInt } from 'class-validator';

export class CreateProductDto {
  // ... autres champs existants

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  categoryIds?: number[]; // Array d'IDs de catégories à lier
}

export class UpdateProductDto {
  // ... autres champs existants

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  categoryIds?: number[]; // Permet de modifier les catégories liées
}
```

### 2. Service Product - Méthodes de Liaison

```typescript
// src/product/product.service.ts

async createProduct(dto: CreateProductDto, files: Express.Multer.File[]) {
  console.log('📦 Création produit avec catégories:', dto.categoryIds);

  // 1. Vérifier que toutes les catégories existent
  if (dto.categoryIds && dto.categoryIds.length > 0) {
    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: dto.categoryIds }
      }
    });

    if (categories.length !== dto.categoryIds.length) {
      const foundIds = categories.map(c => c.id);
      const missingIds = dto.categoryIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(
        `Catégories introuvables: ${missingIds.join(', ')}. ` +
        `Veuillez sélectionner des catégories existantes.`
      );
    }

    console.log(`✅ ${categories.length} catégorie(s) validée(s):`, categories.map(c => c.name));
  }

  // 2. Créer le produit avec liaison aux catégories
  const product = await this.prisma.product.create({
    data: {
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock || 0,
      status: dto.status || 'DRAFT',
      genre: dto.genre || 'UNISEXE',
      isReadyProduct: dto.isReadyProduct || false,
      suggestedPrice: dto.suggestedPrice,

      // 🔗 Liaison avec les catégories via connect
      categories: dto.categoryIds && dto.categoryIds.length > 0 ? {
        connect: dto.categoryIds.map(id => ({ id }))
      } : undefined
    },
    include: {
      categories: true, // Inclure les catégories dans la réponse
      colorVariations: {
        include: {
          images: {
            include: {
              delimitations: true
            }
          }
        }
      }
    }
  });

  console.log(`✅ Produit créé avec ${product.categories.length} catégorie(s) liées`);

  // 3. Gérer les colorVariations...
  // (code existant pour créer les couleurs, images, stocks, etc.)

  return {
    success: true,
    message: 'Produit créé avec succès',
    data: product
  };
}

async updateProduct(productId: number, dto: UpdateProductDto) {
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
    include: { categories: true }
  });

  if (!product) {
    throw new NotFoundException(`Produit ${productId} introuvable`);
  }

  // Vérifier les nouvelles catégories si categoryIds fourni
  if (dto.categoryIds) {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: dto.categoryIds } }
    });

    if (categories.length !== dto.categoryIds.length) {
      const foundIds = categories.map(c => c.id);
      const missingIds = dto.categoryIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(
        `Catégories introuvables: ${missingIds.join(', ')}`
      );
    }
  }

  // Mettre à jour le produit
  const updated = await this.prisma.product.update({
    where: { id: productId },
    data: {
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      status: dto.status,
      genre: dto.genre,
      suggestedPrice: dto.suggestedPrice,

      // 🔗 Remplacer les catégories liées
      categories: dto.categoryIds ? {
        set: [], // Supprimer toutes les liaisons actuelles
        connect: dto.categoryIds.map(id => ({ id })) // Créer nouvelles liaisons
      } : undefined
    },
    include: {
      categories: true,
      colorVariations: {
        include: {
          images: {
            include: {
              delimitations: true
            }
          }
        }
      }
    }
  });

  console.log(`✅ Produit ${productId} mis à jour avec ${updated.categories.length} catégorie(s)`);

  return {
    success: true,
    message: 'Produit mis à jour avec succès',
    data: updated
  };
}

async getAllProducts() {
  const products = await this.prisma.product.findMany({
    where: { isDelete: false },
    include: {
      categories: {
        select: {
          id: true,
          name: true,
          level: true,
          parentId: true
        }
      },
      colorVariations: {
        include: {
          images: true
        }
      },
      stocks: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    success: true,
    data: products.map(product => ({
      ...product,
      categoryIds: product.categories.map(c => c.id),
      categoryNames: product.categories.map(c => c.name)
    }))
  };
}

async getProductsByCategory(categoryId: number) {
  const category = await this.prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  if (!category) {
    throw new NotFoundException(`Catégorie ${categoryId} introuvable`);
  }

  const products = await this.prisma.product.findMany({
    where: {
      categories: {
        some: { id: categoryId }
      },
      isDelete: false
    },
    include: {
      categories: true,
      colorVariations: {
        include: {
          images: true
        }
      }
    }
  });

  return {
    success: true,
    category: {
      id: category.id,
      name: category.name,
      level: category.level,
      productCount: category._count.products
    },
    data: products
  };
}
```

### 3. Controller - Endpoints

```typescript
// src/product/product.controller.ts

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 50))
  async create(
    @Body('productData') productDataJson: string,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    const productData: CreateProductDto = JSON.parse(productDataJson);

    console.log('📥 Création de produit:', {
      name: productData.name,
      categoryIds: productData.categoryIds,
      colorVariationsCount: productData.colorVariations?.length || 0
    });

    return this.productService.createProduct(productData, files || []);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto
  ) {
    console.log('📥 Modification de produit:', {
      productId: id,
      categoryIds: dto.categoryIds
    });

    return this.productService.updateProduct(id, dto);
  }

  @Get()
  async findAll() {
    return this.productService.getAllProducts();
  }

  @Get('by-category/:categoryId')
  async findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.productService.getProductsByCategory(categoryId);
  }
}
```

## 📊 Frontend - Services

### Service Catégorie

```typescript
// frontend/src/services/categoryService.ts

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface Category {
  id: number;
  name: string;
  description?: string;
  level: number;
  parentId?: number;
  order: number;
  _count?: {
    products: number;
    children: number;
  };
}

class CategoryService {
  async getAllCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE}/categories`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des catégories');
    }

    const data = await response.json();
    return data.data || data;
  }

  async getCategoryHierarchy(): Promise<Category[]> {
    const response = await fetch(`${API_BASE}/categories/hierarchy`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la hiérarchie');
    }

    const data = await response.json();
    return data.data || data;
  }

  async getProductsByCategory(categoryId: number) {
    const response = await fetch(`${API_BASE}/products/by-category/${categoryId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des produits');
    }

    return await response.json();
  }
}

export default new CategoryService();
```

### Service Produit (Mise à jour)

```typescript
// frontend/src/services/productService.ts

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  suggestedPrice?: number;
  stock: number;
  status: string;

  // 🔗 Catégories
  categoryIds: number[]; // Array d'IDs de catégories

  sizes: string[];
  genre?: string;
  isReadyProduct?: boolean;
  colorVariations: ColorVariationDto[];
}

class ProductService {
  async createProduct(payload: CreateProductPayload, files: File[]): Promise<any> {
    const formData = new FormData();

    // Préparer les données
    const productData = {
      ...payload,
      categoryIds: payload.categoryIds || [] // ✅ Envoyer les IDs de catégories
    };

    formData.append('productData', JSON.stringify(productData));

    // Ajouter les fichiers
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création');
    }

    return await response.json();
  }

  async updateProduct(productId: number, payload: Partial<CreateProductPayload>): Promise<any> {
    const response = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...payload,
        categoryIds: payload.categoryIds || []
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour');
    }

    return await response.json();
  }
}

export default new ProductService();
```

## 🎨 Frontend - Composant Sélecteur

```tsx
// frontend/src/components/CategoryMultiSelector.tsx

import React, { useEffect, useState } from 'react';
import categoryService, { Category } from '../services/categoryService';

interface CategoryMultiSelectorProps {
  selectedIds: number[];
  onChange: (categoryIds: number[]) => void;
  disabled?: boolean;
}

export const CategoryMultiSelector: React.FC<CategoryMultiSelectorProps> = ({
  selectedIds,
  onChange,
  disabled = false
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
      console.log('📦 Catégories chargées:', data.length);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (categoryId: number) => {
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter(id => id !== categoryId));
    } else {
      onChange([...selectedIds, categoryId]);
    }
  };

  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.level]) acc[cat.level] = [];
    acc[cat.level].push(cat);
    return acc;
  }, {} as Record<number, Category[]>);

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement des catégories...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold">
          Catégories * (sélection multiple)
        </label>
        <span className="text-xs text-gray-500">
          {selectedIds.length} sélectionnée(s)
        </span>
      </div>

      {Object.entries(groupedCategories)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([level, cats]) => (
          <div key={level} className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase">
              Niveau {level}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {cats.map(cat => (
                <label
                  key={cat.id}
                  className={`
                    flex items-center gap-2 p-3 border rounded cursor-pointer
                    transition-all duration-200
                    ${selectedIds.includes(cat.id)
                      ? 'bg-blue-50 border-blue-500 text-blue-900'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(cat.id)}
                    onChange={() => handleToggle(cat.id)}
                    disabled={disabled}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{cat.name}</div>
                    {cat._count && cat._count.products > 0 && (
                      <div className="text-xs text-gray-500">
                        {cat._count.products} produit(s)
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}

      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-xs text-blue-800">
          ℹ️ <strong>Sélectionnez les catégories existantes.</strong>
          <br />
          Pour créer de nouvelles catégories, rendez-vous dans{' '}
          <a href="/admin/categories" className="underline font-semibold">
            Gestion des catégories
          </a>
        </p>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm font-semibold text-green-900 mb-2">
            ✅ Catégories sélectionnées:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedIds.map(id => {
              const cat = categories.find(c => c.id === id);
              return cat ? (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-green-300 rounded text-xs"
                >
                  {cat.name}
                  <button
                    type="button"
                    onClick={() => handleToggle(id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};
```

## 🔄 Intégration dans ProductFormMain

```typescript
// frontend/src/components/ProductFormMain.tsx

import { CategoryMultiSelector } from './CategoryMultiSelector';

const ProductFormMain: React.FC = () => {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // Dans le formulaire
  const handleSubmit = async () => {
    const payload = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
      categoryIds: selectedCategoryIds, // ✅ Envoyer les IDs sélectionnés
      // ... autres champs
    };

    await productService.createProduct(payload, files);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Step 3: Catégories */}
      <CategoryMultiSelector
        selectedIds={selectedCategoryIds}
        onChange={setSelectedCategoryIds}
      />

      {/* Autres champs... */}
    </form>
  );
};
```

## ✅ Checklist d'Implémentation

### Backend
- [ ] Mettre à jour CreateProductDto avec `categoryIds: number[]`
- [ ] Mettre à jour UpdateProductDto avec `categoryIds: number[]`
- [ ] Modifier `createProduct()` pour valider et connecter les catégories
- [ ] Modifier `updateProduct()` pour mettre à jour les liaisons
- [ ] Ajouter endpoint `GET /products/by-category/:id`
- [ ] Inclure `categories` dans les réponses API
- [ ] Tester création avec categoryIds valides/invalides
- [ ] Tester mise à jour des liaisons

### Frontend
- [ ] Créer `CategoryMultiSelector` component
- [ ] Mettre à jour `productService.createProduct()` pour envoyer categoryIds
- [ ] Mettre à jour `productService.updateProduct()` pour envoyer categoryIds
- [ ] Intégrer dans ProductFormMain
- [ ] Gérer l'état `selectedCategoryIds`
- [ ] Afficher feedback visuel des catégories sélectionnées
- [ ] Ajouter lien vers /admin/categories
- [ ] Tester sélection multiple
- [ ] Tester modification des catégories

## 🧪 Tests

### Test Backend (exemple)

```bash
# Créer produit avec catégories
curl -X POST http://localhost:3004/products \
  -F 'productData={"name":"T-shirt Test","price":2500,"categoryIds":[1,2,3],"colorVariations":[...]}' \
  -F 'files=@image.jpg'

# Récupérer produits d'une catégorie
curl http://localhost:3004/products/by-category/1

# Mettre à jour catégories d'un produit
curl -X PATCH http://localhost:3004/products/1 \
  -H "Content-Type: application/json" \
  -d '{"categoryIds":[2,4,5]}'
```

Cette implémentation permet de **lier les produits aux catégories existantes** via une relation many-to-many, sans possibilité de créer de nouvelles catégories depuis le formulaire de produit. 🚀
