# 🎨 Guide Backend - Gestion des Designs Personnalisés

## 📋 Vue d'ensemble

Le backend Printalma prend maintenant en charge la **gestion complète des designs personnalisés**. Cette fonctionnalité permet aux utilisateurs d'ajouter des designs uniques à chaque image de produit, créant ainsi une distinction claire entre **produits vierges** et **produits avec designs**.

## 🗄️ Structure de données

### Modèle Product étendu
```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Float
  stock       Int
  status      PublicationStatus @default(DRAFT)
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Nouveaux champs pour designs personnalisés
  hasCustomDesigns Boolean @default(false)
  designsMetadata  Json?   @default("{\"totalDesigns\": 0, \"lastUpdated\": null}")

  categories      Category[]        @relation("CategoryToProduct")
  sizes           ProductSize[]
  colorVariations ColorVariation[]
  orderItems      OrderItem[]
  vendorProducts  VendorProduct[]
}
```

### Modèle ProductImage étendu
```prisma
model ProductImage {
  id               Int      @id @default(autoincrement())
  view             String   // e.g., 'Front', 'Back'
  url              String
  publicId         String
  naturalWidth     Int?
  naturalHeight    Int?
  
  // Champs étendus pour designs personnalisés
  designUrl        String?  // URL du design appliqué
  designPublicId   String?  // Public ID Cloudinary du design
  designFileName   String?  // Nom du fichier généré
  designUploadDate DateTime? // Date d'upload
  designSize       Int?     // Taille en bytes
  designOriginalName String? // Nom original fourni
  designDescription String? // Description optionnelle
  isDesignActive   Boolean  @default(true) // Design actif
  
  colorVariationId Int
  colorVariation   ColorVariation @relation(fields: [colorVariationId], references: [id], onDelete: Cascade)
  delimitations    Delimitation[]
  
  @@index([colorVariationId])
  @@index([designUrl])
  @@index([isDesignActive])
}
```

## 🛠️ API Endpoints

### 1. Upload de design
```http
POST /api/products/{productId}/colors/{colorId}/images/{imageId}/design
Content-Type: multipart/form-data

Body:
- design: File (image PNG, JPG, JPEG, SVG - max 10MB)
- originalName: string (optionnel)
- description: string (optionnel)
```

**Réponse:**
```json
{
  "success": true,
  "design": {
    "id": "designs/design_abc123",
    "url": "https://res.cloudinary.com/example/image/upload/v1/designs/design_abc123.webp",
    "filename": "design_abc123.webp",
    "size": 245760
  }
}
```

### 2. Remplacement de design
```http
PATCH /api/products/{productId}/colors/{colorId}/images/{imageId}/design
Content-Type: multipart/form-data

Body:
- design: File (nouvelle image)
- originalName: string
```

**Réponse:**
```json
{
  "success": true,
  "design": {
    "id": "designs/design_def456",
    "url": "https://res.cloudinary.com/example/image/upload/v1/designs/design_def456.webp",
    "filename": "design_def456.webp",
    "size": 312345
  },
  "previousDesign": {
    "id": "designs/design_abc123",
    "deleted": true
  }
}
```

### 3. Suppression de design
```http
DELETE /api/products/{productId}/colors/{colorId}/images/{imageId}/design
```

**Réponse:**
```json
{
  "success": true,
  "deletedDesign": {
    "id": "designs/design_abc123",
    "filename": "design_abc123.webp"
  }
}
```

### 4. Récupération de design
```http
GET /api/products/{productId}/colors/{colorId}/images/{imageId}/design
```

**Réponse:**
```json
{
  "design": {
    "id": "designs/design_abc123",
    "url": "https://res.cloudinary.com/example/image/upload/v1/designs/design_abc123.webp",
    "filename": "design_abc123.webp",
    "originalName": "mon-design.png",
    "size": 245760,
    "uploadedAt": "2024-01-15T10:30:00Z",
    "isActive": true,
    "description": "Design personnalisé pour le front"
  }
}
```

### 5. Produits vierges
```http
GET /api/products/blank?status=all&limit=50&offset=0&search=
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-shirt Basic",
      "price": 19.99,
      "status": "PUBLISHED",
      "hasDesign": false,
      "designCount": 0,
      "colorVariations": [...]
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasNext": false
  }
}
```

### 6. Statistiques des designs
```http
GET /api/products/design-stats
```

**Réponse:**
```json
{
  "success": true,
  "stats": {
    "totalProducts": 100,
    "productsWithDesign": 45,
    "blankProducts": 55,
    "designPercentage": 45.0,
    "totalDesigns": 120,
    "averageDesignsPerProduct": 1.2
  }
}
```

## 🔧 Logique métier

### Validation des fichiers
```typescript
private validateDesignFile(file: Express.Multer.File) {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const minDimensions = { width: 100, height: 100 };
  const maxDimensions = { width: 4000, height: 4000 };

  // Validation du type MIME
  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestException('Format non supporté: PNG, JPG, JPEG, SVG');
  }

  // Validation de la taille
  if (file.size > maxSize) {
    throw new BadRequestException('Fichier trop volumineux: max 10MB');
  }

  // Validation du nom de fichier
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/g;
  if (file.originalname && dangerousChars.test(file.originalname)) {
    throw new BadRequestException('Nom de fichier contient des caractères interdits');
  }

  return true;
}
```

### Gestion Cloudinary
- **Dossier de stockage** : `/designs/`
- **Nommage automatique** : `design_{timestamp}_{random}`
- **Formats de sortie** : WebP pour optimisation
- **Suppression automatique** : Lors du remplacement/suppression

### Mise à jour des métadonnées
```typescript
private async updateProductDesignMetadata(productId: number) {
  const designCount = await this.prisma.productImage.count({
    where: {
      colorVariation: { productId },
      designUrl: { not: null },
      isDesignActive: true
    }
  });

  await this.prisma.product.update({
    where: { id: productId },
    data: {
      hasCustomDesigns: designCount > 0,
      designsMetadata: {
        totalDesigns: designCount,
        lastUpdated: new Date().toISOString()
      }
    }
  });
}
```

## 📊 Réponses API mises à jour

### GET /api/products/{id}
```json
{
  "id": 1,
  "name": "T-shirt Premium",
  "description": "T-shirt de qualité supérieure",
  "price": 25.99,
  "stock": 50,
  "status": "PUBLISHED",
  "hasCustomDesigns": true,
  "designsMetadata": {
    "totalDesigns": 3,
    "lastUpdated": "2024-01-15T10:30:00Z"
  },
  "categories": [...],
  "sizes": [...],
  "colorVariations": [
    {
      "id": 1,
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "images": [
        {
          "id": 1,
          "view": "Front",
          "url": "https://res.cloudinary.com/example/products/image.jpg",
          "publicId": "products/image_123",
          "naturalWidth": 800,
          "naturalHeight": 600,
          "customDesign": {
            "id": "designs/design_abc123",
            "url": "https://res.cloudinary.com/example/designs/design_abc123.webp",
            "originalName": "logo-entreprise.png",
            "thumbnailUrl": "https://res.cloudinary.com/example/designs/design_abc123.webp",
            "uploadedAt": "2024-01-15T10:30:00Z",
            "size": 245760,
            "isActive": true,
            "description": "Logo de l'entreprise"
          }
        }
      ]
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## 🔍 Cas d'usage

### 1. Produit sans design (vierge)
```json
{
  "id": 1,
  "hasCustomDesigns": false,
  "designsMetadata": {
    "totalDesigns": 0,
    "lastUpdated": null
  },
  "colorVariations": [
    {
      "images": [
        {
          "customDesign": null
        }
      ]
    }
  ]
}
```

### 2. Produit avec designs partiels
```json
{
  "id": 2,
  "hasCustomDesigns": true,
  "designsMetadata": {
    "totalDesigns": 1,
    "lastUpdated": "2024-01-15T10:30:00Z"
  },
  "colorVariations": [
    {
      "images": [
        {
          "view": "Front",
          "customDesign": {
            "id": "designs/design_abc123",
            "url": "https://...",
            "isActive": true
          }
        },
        {
          "view": "Back",
          "customDesign": null
        }
      ]
    }
  ]
}
```

## ⚠️ Gestion d'erreurs

### Codes de statut
- **200** : Succès
- **201** : Design créé
- **400** : Données invalides, fichier non supporté
- **404** : Produit/couleur/image non trouvé
- **413** : Fichier trop volumineux
- **500** : Erreur serveur

### Messages d'erreur
```json
{
  "statusCode": 400,
  "message": "Format de fichier non supporté. Formats acceptés: PNG, JPG, JPEG, SVG",
  "error": "Bad Request"
}
```

## 🚀 Performance et optimisation

### Index de base de données
```sql
CREATE INDEX idx_product_images_design_url ON product_images(design_url);
CREATE INDEX idx_product_images_is_design_active ON product_images(is_design_active);
CREATE INDEX idx_products_has_custom_designs ON products(has_custom_designs);
```

### Requêtes optimisées
```sql
-- Produits avec designs
SELECT * FROM products WHERE has_custom_designs = true;

-- Images avec designs actifs
SELECT * FROM product_images WHERE design_url IS NOT NULL AND is_design_active = true;

-- Comptage des designs par produit
SELECT 
  p.id,
  p.name,
  COUNT(pi.design_url) as design_count
FROM products p
LEFT JOIN color_variations cv ON cv.product_id = p.id
LEFT JOIN product_images pi ON pi.color_variation_id = cv.id AND pi.design_url IS NOT NULL
GROUP BY p.id, p.name;
```

## 🧪 Tests et monitoring

### Tests unitaires
```typescript
describe('Design Management', () => {
  it('should upload design successfully', async () => {
    const result = await productService.uploadDesign(1, 1, 1, mockFile);
    expect(result.success).toBe(true);
    expect(result.design.url).toBeDefined();
  });

  it('should reject invalid file format', async () => {
    await expect(
      productService.uploadDesign(1, 1, 1, invalidFile)
    ).rejects.toThrow('Format de fichier non supporté');
  });
});
```

### Monitoring recommandé
- **Métriques** : Nombre de designs uploadés/jour
- **Alertes** : Erreurs d'upload récurrentes
- **Logs** : Toutes les opérations CRUD sur designs
- **Espace disque** : Surveillance Cloudinary

## 🔄 Migration et compatibilité

### Rétrocompatibilité
- ✅ Produits existants continuent de fonctionner
- ✅ Nouveaux champs optionnels avec valeurs par défaut
- ✅ API existante inchangée
- ✅ Ajout progressif des designs possible

### Script de migration (si nécessaire)
```sql
-- Mise à jour des produits existants
UPDATE products 
SET has_custom_designs = false, 
    designs_metadata = '{"totalDesigns": 0, "lastUpdated": null}'
WHERE has_custom_designs IS NULL;

-- Mise à jour des images existantes
UPDATE product_images 
SET is_design_active = true
WHERE design_url IS NOT NULL AND is_design_active IS NULL;
```

---

**Note** : Cette implémentation est **entièrement optionnelle** et **rétrocompatible**. Les produits peuvent être créés et utilisés sans designs, et les designs peuvent être ajoutés à tout moment après la création du produit. 