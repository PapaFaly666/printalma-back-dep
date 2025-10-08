# Guide Backend - Gestion des Stocks pour Produits Mockup

## 📋 Vue d'ensemble

Ce guide explique comment gérer les stocks lors de la création de produits mockup dans le backend NestJS. Les stocks sont organisés selon **3 dimensions** :

1. **Variation de Catégorie** (Col Rond, Col V, etc.)
2. **Couleur** (Blanc, Noir, Bleu, etc.)
3. **Taille** (S, M, L, XL, etc.)

## 🎯 Format de Données Frontend

### Ce que le frontend envoie

```json
{
  "name": "T-shirt Premium Personnalisable",
  "description": "T-shirt de qualité pour impression personnalisée",
  "price": 2500,
  "categoryIds": ["parent-id", "child-id", "variation-col-rond-id", "variation-col-v-id"],
  "sizes": ["S", "M", "L", "XL"],

  "categoryVariations": [
    {
      "categoryId": "variation-col-rond-id",
      "categoryName": "Col Rond",
      "colorVariations": [
        {
          "name": "Bleu Marine",
          "colorCode": "#001F3F",
          "stockBySize": {
            "S": 10,
            "M": 15,
            "L": 20,
            "XL": 5
          },
          "images": [
            {
              "fileId": "1678886400001",
              "view": "Front",
              "delimitations": [...]
            }
          ]
        },
        {
          "name": "Blanc",
          "colorCode": "#FFFFFF",
          "stockBySize": {
            "S": 8,
            "M": 12,
            "L": 18,
            "XL": 7
          },
          "images": [...]
        }
      ]
    },
    {
      "categoryId": "variation-col-v-id",
      "categoryName": "Col V",
      "colorVariations": [
        {
          "name": "Noir",
          "colorCode": "#000000",
          "stockBySize": {
            "S": 12,
            "M": 18,
            "L": 22,
            "XL": 8
          },
          "images": [...]
        }
      ]
    }
  ]
}
```

**📌 Point clé** : `stockBySize` est un **objet** `{ [size: string]: number }`, pas un array.

## 🗄️ Schéma Prisma

```prisma
// prisma/schema.prisma

model Product {
  id                Int                @id @default(autoincrement())
  name              String
  description       String?
  price             Float
  suggestedPrice    Float?
  status            String             @default("draft")
  genre             String?            @default("UNISEXE")
  isReadyProduct    Boolean            @default(false)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  // Relations
  categories        ProductCategory[]
  categoryVariations ProductCategoryVariation[]
  colorVariations   ProductColorVariation[]
  stocks            ProductStock[]

  @@index([status])
  @@map("products")
}

// Table de liaison Product <-> Category
model ProductCategory {
  id          Int      @id @default(autoincrement())
  productId   Int
  categoryId  String
  createdAt   DateTime @default(now())

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, categoryId])
  @@index([productId])
  @@index([categoryId])
  @@map("product_categories")
}

// Variations de catégorie pour un produit (Col Rond, Col V, etc.)
model ProductCategoryVariation {
  id            Int      @id @default(autoincrement())
  productId     Int
  categoryId    String   // ID de la catégorie variation (level 2)
  categoryName  String   // Nom affiché: "Col Rond", "Col V"
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  colorVariations ProductColorVariation[]

  @@unique([productId, categoryId])
  @@index([productId])
  @@map("product_category_variations")
}

// Couleurs pour chaque variation de catégorie
model ProductColorVariation {
  id                      Int      @id @default(autoincrement())
  productId               Int
  categoryVariationId     Int      // Référence à ProductCategoryVariation
  name                    String   // "Bleu Marine", "Blanc"
  colorCode               String   // "#001F3F"
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  product                 Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  categoryVariation       ProductCategoryVariation @relation(fields: [categoryVariationId], references: [id], onDelete: Cascade)
  images                  ProductImage[]
  stocks                  ProductStock[]

  @@index([productId])
  @@index([categoryVariationId])
  @@map("product_color_variations")
}

// Images pour chaque couleur
model ProductImage {
  id                Int      @id @default(autoincrement())
  colorVariationId  Int
  url               String
  view              String   // Front, Back, Left, Right, etc.
  createdAt         DateTime @default(now())

  colorVariation    ProductColorVariation @relation(fields: [colorVariationId], references: [id], onDelete: Cascade)
  delimitations     ProductDelimitation[]

  @@index([colorVariationId])
  @@map("product_images")
}

// Zones de délimitation pour impression
model ProductDelimitation {
  id              Int      @id @default(autoincrement())
  imageId         Int
  name            String?
  x               Float
  y               Float
  width           Float
  height          Float
  rotation        Float    @default(0)
  coordinateType  String   @default("PERCENTAGE") // PERCENTAGE | ABSOLUTE
  createdAt       DateTime @default(now())

  image           ProductImage @relation(fields: [imageId], references: [id], onDelete: Cascade)

  @@index([imageId])
  @@map("product_delimitations")
}

// Stocks par variation de catégorie + couleur + taille
model ProductStock {
  id                Int      @id @default(autoincrement())
  productId         Int
  colorVariationId  Int      // Référence à ProductColorVariation
  sizeName          String   // "S", "M", "L", "XL"
  stock             Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  product           Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  colorVariation    ProductColorVariation @relation(fields: [colorVariationId], references: [id], onDelete: Cascade)

  @@unique([productId, colorVariationId, sizeName])
  @@index([productId])
  @@index([colorVariationId])
  @@map("product_stocks")
}
```

## 📝 DTOs de Validation

```typescript
// src/product/dto/create-mockup-product.dto.ts

import {
  IsString,
  IsNumber,
  IsArray,
  IsObject,
  IsOptional,
  ValidateNested,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';

export class DelimitationDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsNumber()
  @IsOptional()
  rotation?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  coordinateType?: 'PERCENTAGE' | 'ABSOLUTE';
}

export class ProductImageDto {
  @IsString()
  fileId: string;

  @IsString()
  view: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DelimitationDto)
  @IsOptional()
  delimitations?: DelimitationDto[];
}

export class ColorVariationDto {
  @IsString()
  name: string;

  @IsString()
  colorCode: string;

  @IsObject()
  stockBySize: Record<string, number>; // { "S": 10, "M": 15, ... }

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images: ProductImageDto[];
}

export class CategoryVariationDto {
  @IsString()
  categoryId: string;

  @IsString()
  categoryName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorVariationDto)
  colorVariations: ColorVariationDto[];
}

export class CreateMockupProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  suggestedPrice?: number;

  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];

  @IsArray()
  @IsString({ each: true })
  sizes: string[];

  @IsString()
  @IsOptional()
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryVariationDto)
  categoryVariations: CategoryVariationDto[];
}
```

## 🔧 Service d'Upload de Fichiers

```typescript
// src/upload/upload.service.ts

import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

@Injectable()
export class UploadService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'products');

  async uploadProductImage(file: Express.Multer.File, fileId: string): Promise<string> {
    // Créer le dossier s'il n'existe pas
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const ext = file.originalname.split('.').pop();
    const filename = `${fileId}_${Date.now()}.${ext}`;
    const filepath = join(this.uploadDir, filename);

    // Sauvegarder le fichier
    await writeFile(filepath, file.buffer);

    // Retourner l'URL publique
    return `/uploads/products/${filename}`;
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    fileIdMap: Map<string, string>
  ): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();

    for (const [fileId, originalFileId] of fileIdMap.entries()) {
      const file = files.find(f =>
        f.fieldname === `file_${originalFileId}` ||
        f.originalname.includes(originalFileId)
      );

      if (file) {
        const url = await this.uploadProductImage(file, fileId);
        urlMap.set(originalFileId, url);
      }
    }

    return urlMap;
  }
}
```

## 🏗️ Service Principal

```typescript
// src/product/product.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateMockupProductDto } from './dto/create-mockup-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService
  ) {}

  async createMockupProduct(
    dto: CreateMockupProductDto,
    files: Express.Multer.File[]
  ) {
    console.log('📦 Création produit mockup:', dto.name);
    console.log('📁 Fichiers reçus:', files.length);

    // 1. Validation des catégories
    await this.validateCategories(dto.categoryIds);

    // 2. Validation des tailles
    if (!dto.sizes || dto.sizes.length === 0) {
      throw new BadRequestException('Au moins une taille est requise');
    }

    // 3. Créer une map des fileIds pour l'upload
    const fileIdMap = new Map<string, string>();
    dto.categoryVariations.forEach(catVar => {
      catVar.colorVariations.forEach(colorVar => {
        colorVar.images.forEach(img => {
          fileIdMap.set(img.fileId, img.fileId);
        });
      });
    });

    // 4. Uploader tous les fichiers
    const uploadedUrls = await this.uploadService.uploadMultipleImages(files, fileIdMap);
    console.log('✅ Fichiers uploadés:', uploadedUrls.size);

    // 5. Utiliser une transaction pour garantir la cohérence
    const product = await this.prisma.$transaction(async (prisma) => {
      // 5.1. Créer le produit principal
      const newProduct = await prisma.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          suggestedPrice: dto.suggestedPrice,
          genre: dto.genre || 'UNISEXE',
          isReadyProduct: false,
          status: 'draft'
        }
      });

      console.log('✅ Produit créé:', newProduct.id);

      // 5.2. Lier les catégories au produit
      await Promise.all(
        dto.categoryIds.map(categoryId =>
          prisma.productCategory.create({
            data: {
              productId: newProduct.id,
              categoryId
            }
          })
        )
      );

      console.log('✅ Catégories liées:', dto.categoryIds.length);

      // 5.3. Créer les variations de catégorie avec couleurs et stocks
      for (const catVar of dto.categoryVariations) {
        // Créer la variation de catégorie
        const categoryVariation = await prisma.productCategoryVariation.create({
          data: {
            productId: newProduct.id,
            categoryId: catVar.categoryId,
            categoryName: catVar.categoryName
          }
        });

        console.log(`📁 Variation de catégorie créée: ${catVar.categoryName}`);

        // Pour chaque couleur dans cette variation
        for (const colorVar of catVar.colorVariations) {
          // Créer la variation de couleur
          const colorVariation = await prisma.productColorVariation.create({
            data: {
              productId: newProduct.id,
              categoryVariationId: categoryVariation.id,
              name: colorVar.name,
              colorCode: colorVar.colorCode.toUpperCase()
            }
          });

          console.log(`🎨 Couleur créée: ${colorVar.name} (${colorVar.colorCode})`);

          // Créer les images pour cette couleur
          for (const imageDto of colorVar.images) {
            const imageUrl = uploadedUrls.get(imageDto.fileId);

            if (!imageUrl) {
              console.warn(`⚠️ Image non trouvée pour fileId: ${imageDto.fileId}`);
              continue;
            }

            const image = await prisma.productImage.create({
              data: {
                colorVariationId: colorVariation.id,
                url: imageUrl,
                view: imageDto.view
              }
            });

            console.log(`🖼️ Image créée: ${imageDto.view}`);

            // Créer les délimitations pour cette image
            if (imageDto.delimitations && imageDto.delimitations.length > 0) {
              await Promise.all(
                imageDto.delimitations.map(delim =>
                  prisma.productDelimitation.create({
                    data: {
                      imageId: image.id,
                      name: delim.name,
                      x: delim.x,
                      y: delim.y,
                      width: delim.width,
                      height: delim.height,
                      rotation: delim.rotation || 0,
                      coordinateType: delim.coordinateType || 'PERCENTAGE'
                    }
                  })
                )
              );

              console.log(`📐 Délimitations créées: ${imageDto.delimitations.length}`);
            }
          }

          // ✅ IMPORTANT : Créer les stocks pour cette couleur
          const stockEntries = Object.entries(colorVar.stockBySize);

          if (stockEntries.length === 0) {
            throw new BadRequestException(
              `Aucun stock défini pour "${colorVar.name}" dans "${catVar.categoryName}"`
            );
          }

          for (const [sizeName, stockQuantity] of stockEntries) {
            // Vérifier que la taille est bien dans la liste des tailles du produit
            if (!dto.sizes.includes(sizeName)) {
              throw new BadRequestException(
                `Taille "${sizeName}" non définie dans les tailles du produit`
              );
            }

            await prisma.productStock.create({
              data: {
                productId: newProduct.id,
                colorVariationId: colorVariation.id,
                sizeName,
                stock: stockQuantity
              }
            });
          }

          const totalStock = stockEntries.reduce((sum, [, qty]) => sum + qty, 0);
          console.log(`📦 Stocks créés pour ${colorVar.name}: ${totalStock} unités`);
        }
      }

      return newProduct;
    });

    // 6. Recharger le produit complet avec toutes ses relations
    return this.getProductById(product.id);
  }

  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        categoryVariations: {
          include: {
            colorVariations: {
              include: {
                images: {
                  include: {
                    delimitations: true
                  }
                },
                stocks: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException(`Produit #${id} non trouvé`);
    }

    // Reformater les données pour le frontend
    return this.formatProductForFrontend(product);
  }

  private formatProductForFrontend(product: any) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      suggestedPrice: product.suggestedPrice,
      genre: product.genre,
      isReadyProduct: product.isReadyProduct,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,

      // Catégories
      categoryIds: product.categories.map(c => c.categoryId),

      // Tailles (extraire de tous les stocks)
      sizes: [...new Set(
        product.categoryVariations.flatMap(catVar =>
          catVar.colorVariations.flatMap(colorVar =>
            colorVar.stocks.map(s => s.sizeName)
          )
        )
      )],

      // Variations de catégorie
      categoryVariations: product.categoryVariations.map(catVar => ({
        id: catVar.id,
        categoryId: catVar.categoryId,
        categoryName: catVar.categoryName,

        colorVariations: catVar.colorVariations.map(colorVar => ({
          id: colorVar.id,
          name: colorVar.name,
          colorCode: colorVar.colorCode,

          // Images
          images: colorVar.images.map(img => ({
            id: img.id,
            url: img.url,
            view: img.view,
            delimitations: img.delimitations.map(delim => ({
              id: delim.id,
              name: delim.name,
              x: delim.x,
              y: delim.y,
              width: delim.width,
              height: delim.height,
              rotation: delim.rotation,
              coordinateType: delim.coordinateType
            }))
          })),

          // Stocks formatés en objet { "S": 10, "M": 15, ... }
          stockBySize: colorVar.stocks.reduce((acc, stock) => {
            acc[stock.sizeName] = stock.stock;
            return acc;
          }, {} as Record<string, number>)
        }))
      }))
    };
  }

  private async validateCategories(categoryIds: string[]) {
    // Vérifier que toutes les catégories existent
    // À implémenter selon votre service de catégories

    // Exemple:
    // const categories = await this.categoryService.findByIds(categoryIds);
    // if (categories.length !== categoryIds.length) {
    //   throw new BadRequestException('Certaines catégories sont invalides');
    // }
  }

  // Méthode pour récupérer tous les produits mockup
  async getAllMockupProducts() {
    const products = await this.prisma.product.findMany({
      where: { isReadyProduct: false },
      include: {
        categories: true,
        categoryVariations: {
          include: {
            colorVariations: {
              include: {
                images: {
                  include: {
                    delimitations: true
                  }
                },
                stocks: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return products.map(p => this.formatProductForFrontend(p));
  }

  // Méthode pour mettre à jour les stocks
  async updateStocks(
    productId: number,
    colorVariationId: number,
    stockBySize: Record<string, number>
  ) {
    console.log(`📦 Mise à jour stocks - Produit: ${productId}, Couleur: ${colorVariationId}`);

    await this.prisma.$transaction(async (prisma) => {
      for (const [sizeName, quantity] of Object.entries(stockBySize)) {
        await prisma.productStock.upsert({
          where: {
            productId_colorVariationId_sizeName: {
              productId,
              colorVariationId,
              sizeName
            }
          },
          update: {
            stock: quantity
          },
          create: {
            productId,
            colorVariationId,
            sizeName,
            stock: quantity
          }
        });
      }
    });

    console.log('✅ Stocks mis à jour avec succès');

    return this.getProductById(productId);
  }
}
```

## 🎮 Controller

```typescript
// src/product/product.controller.ts

import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  ParseIntPipe
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateMockupProductDto } from './dto/create-mockup-product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('mockup')
  @UseInterceptors(FilesInterceptor('files', 50)) // Max 50 fichiers
  async createMockupProduct(
    @Body('productData') productDataJson: string,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      // Parser le JSON
      const productData: CreateMockupProductDto = JSON.parse(productDataJson);

      console.log('📥 Requête création mockup:', {
        name: productData.name,
        categoryVariations: productData.categoryVariations.length,
        filesCount: files?.length || 0
      });

      // Log détaillé des stocks
      productData.categoryVariations.forEach((catVar, catIdx) => {
        console.log(`\n📁 ${catVar.categoryName}:`);
        catVar.colorVariations.forEach((colorVar, colorIdx) => {
          const totalStock = Object.values(colorVar.stockBySize).reduce((sum, qty) => sum + qty, 0);
          console.log(`  🎨 ${colorVar.name}: ${totalStock} unités`, colorVar.stockBySize);
        });
      });

      // Créer le produit
      const product = await this.productService.createMockupProduct(
        productData,
        files || []
      );

      return {
        success: true,
        message: 'Produit mockup créé avec succès',
        data: product
      };
    } catch (error) {
      console.error('❌ Erreur création mockup:', error);
      throw new BadRequestException(error.message);
    }
  }

  @Get('mockup')
  async getAllMockupProducts() {
    const products = await this.productService.getAllMockupProducts();

    return {
      success: true,
      count: products.length,
      data: products
    };
  }

  @Get(':id')
  async getProductById(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productService.getProductById(id);

    return {
      success: true,
      data: product
    };
  }

  @Put(':id/stocks/:colorVariationId')
  async updateStocks(
    @Param('id', ParseIntPipe) productId: number,
    @Param('colorVariationId', ParseIntPipe) colorVariationId: number,
    @Body('stockBySize') stockBySize: Record<string, number>
  ) {
    const product = await this.productService.updateStocks(
      productId,
      colorVariationId,
      stockBySize
    );

    return {
      success: true,
      message: 'Stocks mis à jour avec succès',
      data: product
    };
  }
}
```

## 🔧 Module

```typescript
// src/product/product.module.ts

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { UploadService } from '../upload/upload.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    }),
  ],
  controllers: [ProductController],
  providers: [ProductService, UploadService, PrismaService],
  exports: [ProductService]
})
export class ProductModule {}
```

## 📊 Exemple de Flux Complet

### 1. Frontend envoie la requête

```typescript
const formData = new FormData();
formData.append('productData', JSON.stringify({
  name: "T-shirt Premium",
  price: 2500,
  categoryIds: ["cat-1", "cat-2", "cat-variation-1"],
  sizes: ["S", "M", "L", "XL"],
  categoryVariations: [
    {
      categoryId: "cat-variation-1",
      categoryName: "Col Rond",
      colorVariations: [
        {
          name: "Blanc",
          colorCode: "#FFFFFF",
          stockBySize: { "S": 10, "M": 15, "L": 20, "XL": 5 },
          images: [{ fileId: "1678886400001", view: "Front", delimitations: [] }]
        }
      ]
    }
  ]
}));

formData.append('file_1678886400001', imageFile);

await axios.post('/products/mockup', formData);
```

### 2. Backend traite la requête

```
📥 Requête création mockup: { name: 'T-shirt Premium', categoryVariations: 1, filesCount: 1 }

📁 Col Rond:
  🎨 Blanc: 50 unités { S: 10, M: 15, L: 20, XL: 5 }

✅ Fichiers uploadés: 1
✅ Produit créé: 1
✅ Catégories liées: 3
📁 Variation de catégorie créée: Col Rond
🎨 Couleur créée: Blanc (#FFFFFF)
🖼️ Image créée: Front
📦 Stocks créés pour Blanc: 50 unités
```

### 3. Réponse au frontend

```json
{
  "success": true,
  "message": "Produit mockup créé avec succès",
  "data": {
    "id": 1,
    "name": "T-shirt Premium",
    "price": 2500,
    "sizes": ["S", "M", "L", "XL"],
    "categoryVariations": [
      {
        "id": 1,
        "categoryId": "cat-variation-1",
        "categoryName": "Col Rond",
        "colorVariations": [
          {
            "id": 1,
            "name": "Blanc",
            "colorCode": "#FFFFFF",
            "stockBySize": {
              "S": 10,
              "M": 15,
              "L": 20,
              "XL": 5
            },
            "images": [...]
          }
        ]
      }
    ]
  }
}
```

## 🧪 Tests

### Test de création

```bash
curl -X POST http://localhost:3004/products/mockup \
  -F 'productData={"name":"Test Mockup","price":2500,"categoryIds":["cat1"],"sizes":["M","L"],"categoryVariations":[{"categoryId":"cat1","categoryName":"Col Rond","colorVariations":[{"name":"Blanc","colorCode":"#FFF","stockBySize":{"M":10,"L":20},"images":[{"fileId":"123","view":"Front"}]}]}]}' \
  -F 'file_123=@image.jpg'
```

### Test de récupération

```bash
curl http://localhost:3004/products/mockup
```

### Test de mise à jour stocks

```bash
curl -X PUT http://localhost:3004/products/1/stocks/1 \
  -H "Content-Type: application/json" \
  -d '{"stockBySize":{"M":15,"L":25}}'
```

## ✅ Points Clés

1. ✅ **Format stocks** : Objet `{ [size]: quantity }`
2. ✅ **3 dimensions** : Variation catégorie → Couleur → Taille
3. ✅ **Transaction** : Garantir la cohérence des données
4. ✅ **Upload** : Map fileId → URL
5. ✅ **Validation** : Tailles cohérentes
6. ✅ **Cascade delete** : Nettoyage automatique
7. ✅ **Index DB** : Performance optimisée

## 📝 Checklist d'implémentation

- [ ] Créer les modèles Prisma
- [ ] Exécuter la migration `npx prisma migrate dev`
- [ ] Créer les DTOs de validation
- [ ] Implémenter UploadService
- [ ] Implémenter ProductService.createMockupProduct
- [ ] Créer le ProductController
- [ ] Tester avec curl ou Postman
- [ ] Vérifier les logs de création
- [ ] Tester la récupération des produits
- [ ] Tester la mise à jour des stocks

Votre backend est maintenant prêt pour gérer des produits mockup avec stocks multi-dimensionnels ! 🚀
