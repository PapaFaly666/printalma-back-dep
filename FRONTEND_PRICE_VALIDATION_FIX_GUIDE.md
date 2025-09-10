# Guide de résolution - Erreur de validation du prix (400 Bad Request)

## 🔍 Diagnostic du problème

D'après l'erreur dans `price.md`, le payload suivant génère une erreur 400 :

```json
{
  "name": "Tshirt de luxe",
  "description": "Thirt prenium haute qualité",
  "price": 12000,
  "stock": 12,
  "status": "PUBLISHED",
  // ... autres champs
}
```

**Status: 400 StatusText:** - Le champ `price` n'est pas correctement validé côté backend.

## 🎯 Problème identifié

Dans `src/product/dto/update-product.dto.ts`, la validation du prix est incomplète :

```typescript
// ❌ PROBLÉMATIQUE ACTUELLE
@ApiPropertyOptional()
@IsOptional()
@IsNumber()
price?: number;
```

Alors que dans `create-product.dto.ts`, la validation est complète :

```typescript
// ✅ VALIDATION CORRECTE
@IsNumber()
@IsPositive({ message: 'Le prix doit être supérieur à 0' })
@Type(() => Number)
price: number;
```

## 🚀 Solution côté Backend

### 1. Corriger UpdateProductDto

Mettre à jour `src/product/dto/update-product.dto.ts` :

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum, ValidateNested, IsBoolean, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  // ✅ CORRECTION DU PRIX
  @ApiPropertyOptional({ 
    description: 'Prix du produit (doit être supérieur à 0)',
    example: 12000
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Le prix doit être supérieur à 0' })
  @Type(() => Number)
  price?: number;

  // ✅ CORRECTION DU PRIX SUGGÉRÉ
  @ApiPropertyOptional({ 
    description: 'Prix suggéré (optionnel)',
    example: 15000
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Le prix suggéré ne peut pas être négatif' })
  @Type(() => Number)
  suggestedPrice?: number;

  // ✅ CORRECTION DU STOCK
  @ApiPropertyOptional({
    description: 'Quantité en stock',
    example: 50
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Le stock ne peut pas être négatif' })
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({ enum: ['PUBLISHED', 'DRAFT'] })
  @IsOptional()
  @IsEnum(['PUBLISHED', 'DRAFT'])
  status?: 'PUBLISHED' | 'DRAFT';

  // ... reste du code inchangé
}
```

### 2. Vérifier le Content-Type

S'assurer que le frontend envoie le bon Content-Type :

```typescript
// ✅ CÔTÉ FRONTEND
const response = await fetch('/api/products/123', {
  method: 'PATCH',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Tshirt de luxe",
    description: "Tshirt premium haute qualité",
    price: 12000,  // ✅ Nombre (pas de string)
    stock: 12,
    status: "PUBLISHED",
    // ... autres champs
  })
});
```

## 🛠️ Solution côté Frontend (temporaire)

En attendant la correction backend, vous pouvez transformer le prix :

```typescript
// 🔄 SOLUTION TEMPORAIRE FRONTEND
const updateProduct = async (productData) => {
  // Transformer tous les champs numériques
  const transformedData = {
    ...productData,
    price: productData.price ? Number(productData.price) : undefined,
    suggestedPrice: productData.suggestedPrice ? Number(productData.suggestedPrice) : undefined,
    stock: productData.stock ? Number(productData.stock) : undefined
  };

  console.log('🔍 Données transformées:', transformedData);

  const response = await fetch('/api/products/123', {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transformedData)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Erreur de mise à jour:', error);
    throw new Error(`Erreur ${response.status}: ${error}`);
  }

  return response.json();
};
```

## 🔍 Validation côté Frontend

Ajouter des validations côté frontend :

```typescript
// ✅ VALIDATION FRONTEND
const validateProductData = (data) => {
  const errors = [];

  // Valider le prix
  if (data.price !== undefined) {
    if (typeof data.price !== 'number' || data.price <= 0) {
      errors.push('Le prix doit être un nombre positif');
    }
  }

  // Valider le stock
  if (data.stock !== undefined) {
    if (typeof data.stock !== 'number' || data.stock < 0) {
      errors.push('Le stock doit être un nombre positif ou zéro');
    }
  }

  // Valider le prix suggéré
  if (data.suggestedPrice !== undefined) {
    if (typeof data.suggestedPrice !== 'number' || data.suggestedPrice < 0) {
      errors.push('Le prix suggéré doit être un nombre positif ou zéro');
    }
  }

  return errors;
};

// Utilisation
const errors = validateProductData(productData);
if (errors.length > 0) {
  console.error('❌ Erreurs de validation:', errors);
  // Afficher les erreurs à l'utilisateur
  return;
}
```

## 🚦 Test de la correction

Après application de la correction backend, tester avec :

```bash
curl -X PATCH http://localhost:3004/products/123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tshirt de luxe",
    "description": "Tshirt premium haute qualité", 
    "price": 12000,
    "stock": 12,
    "status": "PUBLISHED"
  }'
```

## 📝 Points à vérifier

1. **Types de données** : S'assurer que les nombres sont bien des `number` et pas des `string`
2. **Validation positive** : Le prix doit être > 0
3. **Décimales** : Maximum 2 décimales pour les prix
4. **Content-Type** : Toujours `application/json`
5. **Transformation** : Utiliser `@Type(() => Number)` pour la conversion automatique

## ⚡ Solution d'urgence

Si vous ne pouvez pas modifier le backend immédiatement :

```typescript
// 🚨 SOLUTION D'URGENCE - Convertir en string temporairement
const payload = {
  ...productData,
  price: productData.price?.toString(),
  stock: productData.stock?.toString(),
  suggestedPrice: productData.suggestedPrice?.toString()
};
```

**Note** : Cette solution d'urgence n'est pas recommandée à long terme.