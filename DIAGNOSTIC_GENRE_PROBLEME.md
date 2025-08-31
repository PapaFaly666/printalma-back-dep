# 🔍 Guide de Diagnostic - Problème Champ Genre

## 📋 Problème Identifié

Le champ `genre` est toujours mis à `UNISEXE` par défaut dans la base de données, même quand le frontend envoie une valeur différente (ex: `HOMME`, `FEMME`, `BEBE`).

## 🔧 Étapes de Diagnostic

### 1. **Vérifier les Logs Backend**

Après avoir créé un produit prêt avec le frontend, vérifiez les logs du serveur :

```bash
# Dans les logs du serveur, vous devriez voir :
🔍 [CONTROLLER] createReadyProduct - Genre reçu: HOMME
🔍 [CONTROLLER] createReadyProduct - Genre est-il défini? true
🔍 [CONTROLLER] createReadyProduct - Genre est-il HOMME? true
🔍 [BACKEND] createReadyProduct - Genre avant création: HOMME
🔍 [BACKEND] createReadyProduct - Genre est-il HOMME? true
💾 Produit créé avec genre: HOMME
💾 Produit créé - Genre est-il correct? true
```

**Si vous ne voyez pas ces logs ou si les valeurs sont incorrectes, le problème est dans la réception des données.**

### 2. **Vérifier la Base de Données**

Connectez-vous à votre base de données et vérifiez :

```sql
-- Vérifier le schéma de la table Product
\d "Product"

-- Vérifier les produits récents avec leur genre
SELECT id, name, genre, "isReadyProduct" 
FROM "Product" 
WHERE name LIKE '%test%' 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Vérifier si le champ genre a une contrainte par défaut
SELECT column_name, column_default, is_nullable, data_type
FROM information_schema.columns 
WHERE table_name = 'Product' AND column_name = 'genre';
```

### 3. **Tester avec le Script de Test**

Exécutez le script de test pour valider le backend :

```bash
# Installer les dépendances si nécessaire
npm install axios form-data

# Modifier le token admin dans test-genre-backend.js
# Puis exécuter :
node test-genre-backend.js
```

### 4. **Vérifier le DTO**

Assurez-vous que le DTO `CreateReadyProductDto` inclut bien le champ `genre` :

```typescript
// Dans src/product/dto/create-ready-product.dto.ts
export class CreateReadyProductDto {
  // ... autres champs ...
  
  @ApiProperty({ 
    description: 'Genre du produit prêt (public cible)',
    enum: ReadyProductGenre,
    example: ReadyProductGenre.HOMME,
    required: false
  })
  @IsEnum(ReadyProductGenre, { 
    message: 'Le genre doit être "HOMME", "FEMME", "BEBE" ou "UNISEXE"' 
  })
  @IsOptional()
  genre?: ReadyProductGenre = ReadyProductGenre.UNISEXE;
}
```

### 5. **Vérifier le Schéma Prisma**

Vérifiez que le schéma Prisma est correct :

```prisma
// Dans prisma/schema.prisma
model Product {
  // ... autres champs ...
  
  // 🆕 NOUVEAU CHAMP: Genre pour catégoriser les mockups
  genre               ProductGenre @default(UNISEXE)
  
  // ... autres champs ...
}

enum ProductGenre {
  HOMME
  FEMME
  BEBE
  UNISEXE
}
```

## 🚨 Solutions Possibles

### **Solution A : Problème de Parsing JSON**

Si les logs du contrôleur montrent que le genre n'est pas reçu :

```typescript
// Dans le contrôleur, ajoutez cette validation
if (!productDto.genre) {
  console.log('⚠️ ATTENTION: Genre non défini dans le DTO');
  console.log('⚠️ DTO complet:', JSON.stringify(productDto, null, 2));
}
```

### **Solution B : Problème de Validation DTO**

Si le genre est reçu mais pas traité :

```typescript
// Vérifiez que la validation ne rejette pas le genre
@IsEnum(ReadyProductGenre, { 
  message: 'Le genre doit être "HOMME", "FEMME", "BEBE" ou "UNISEXE"' 
})
```

### **Solution C : Problème de Base de Données**

Si le genre est traité mais pas sauvegardé :

```sql
-- Vérifiez que la colonne genre existe et a le bon type
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'Product' AND column_name = 'genre';
```

### **Solution D : Problème de Migration**

Si la migration n'a pas été appliquée :

```bash
# Appliquer la migration manuellement
npx prisma migrate dev --name add_genre_to_products

# Ou utiliser le script de migration manuelle
node apply-migration.js
```

## 🔧 Script de Test Rapide

Créez un fichier `test-quick-genre.js` :

```javascript
const axios = require('axios');

async function testQuick() {
  const testData = {
    name: 'Test Quick Genre',
    description: 'Test rapide du genre',
    price: 1000,
    stock: 10,
    status: 'published',
    isReadyProduct: true,
    genre: 'HOMME',
    categories: ['Test'],
    colorVariations: []
  };

  try {
    const response = await axios.post('http://localhost:3004/products/ready', {
      productData: JSON.stringify(testData)
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Produit créé:', response.data.genre);
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data);
  }
}

testQuick();
```

## 📊 Résultats Attendus

### **Logs Backend Corrects**
```
🔍 [CONTROLLER] createReadyProduct - Genre reçu: HOMME
🔍 [CONTROLLER] createReadyProduct - Genre est-il défini? true
🔍 [BACKEND] createReadyProduct - Genre avant création: HOMME
💾 Produit créé avec genre: HOMME
💾 Produit créé - Genre est-il correct? true
```

### **Base de Données Correcte**
```sql
SELECT name, genre FROM "Product" WHERE name = 'Test Quick Genre';
-- Résultat attendu: genre = 'HOMME'
```

### **Réponse API Correcte**
```json
{
  "id": 123,
  "name": "Test Quick Genre",
  "genre": "HOMME",
  "isReadyProduct": true
}
```

## 🚨 Actions Immédiates

1. **Démarrer le serveur avec les nouveaux logs**
2. **Créer un produit prêt avec le frontend**
3. **Vérifier les logs du serveur**
4. **Exécuter le script de test**
5. **Vérifier la base de données**

---

**Contact :** Une fois le diagnostic effectué, partagez les résultats pour identifier la cause exacte du problème. 

## 📋 Problème Identifié

Le champ `genre` est toujours mis à `UNISEXE` par défaut dans la base de données, même quand le frontend envoie une valeur différente (ex: `HOMME`, `FEMME`, `BEBE`).

## 🔧 Étapes de Diagnostic

### 1. **Vérifier les Logs Backend**

Après avoir créé un produit prêt avec le frontend, vérifiez les logs du serveur :

```bash
# Dans les logs du serveur, vous devriez voir :
🔍 [CONTROLLER] createReadyProduct - Genre reçu: HOMME
🔍 [CONTROLLER] createReadyProduct - Genre est-il défini? true
🔍 [CONTROLLER] createReadyProduct - Genre est-il HOMME? true
🔍 [BACKEND] createReadyProduct - Genre avant création: HOMME
🔍 [BACKEND] createReadyProduct - Genre est-il HOMME? true
💾 Produit créé avec genre: HOMME
💾 Produit créé - Genre est-il correct? true
```

**Si vous ne voyez pas ces logs ou si les valeurs sont incorrectes, le problème est dans la réception des données.**

### 2. **Vérifier la Base de Données**

Connectez-vous à votre base de données et vérifiez :

```sql
-- Vérifier le schéma de la table Product
\d "Product"

-- Vérifier les produits récents avec leur genre
SELECT id, name, genre, "isReadyProduct" 
FROM "Product" 
WHERE name LIKE '%test%' 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Vérifier si le champ genre a une contrainte par défaut
SELECT column_name, column_default, is_nullable, data_type
FROM information_schema.columns 
WHERE table_name = 'Product' AND column_name = 'genre';
```

### 3. **Tester avec le Script de Test**

Exécutez le script de test pour valider le backend :

```bash
# Installer les dépendances si nécessaire
npm install axios form-data

# Modifier le token admin dans test-genre-backend.js
# Puis exécuter :
node test-genre-backend.js
```

### 4. **Vérifier le DTO**

Assurez-vous que le DTO `CreateReadyProductDto` inclut bien le champ `genre` :

```typescript
// Dans src/product/dto/create-ready-product.dto.ts
export class CreateReadyProductDto {
  // ... autres champs ...
  
  @ApiProperty({ 
    description: 'Genre du produit prêt (public cible)',
    enum: ReadyProductGenre,
    example: ReadyProductGenre.HOMME,
    required: false
  })
  @IsEnum(ReadyProductGenre, { 
    message: 'Le genre doit être "HOMME", "FEMME", "BEBE" ou "UNISEXE"' 
  })
  @IsOptional()
  genre?: ReadyProductGenre = ReadyProductGenre.UNISEXE;
}
```

### 5. **Vérifier le Schéma Prisma**

Vérifiez que le schéma Prisma est correct :

```prisma
// Dans prisma/schema.prisma
model Product {
  // ... autres champs ...
  
  // 🆕 NOUVEAU CHAMP: Genre pour catégoriser les mockups
  genre               ProductGenre @default(UNISEXE)
  
  // ... autres champs ...
}

enum ProductGenre {
  HOMME
  FEMME
  BEBE
  UNISEXE
}
```

## 🚨 Solutions Possibles

### **Solution A : Problème de Parsing JSON**

Si les logs du contrôleur montrent que le genre n'est pas reçu :

```typescript
// Dans le contrôleur, ajoutez cette validation
if (!productDto.genre) {
  console.log('⚠️ ATTENTION: Genre non défini dans le DTO');
  console.log('⚠️ DTO complet:', JSON.stringify(productDto, null, 2));
}
```

### **Solution B : Problème de Validation DTO**

Si le genre est reçu mais pas traité :

```typescript
// Vérifiez que la validation ne rejette pas le genre
@IsEnum(ReadyProductGenre, { 
  message: 'Le genre doit être "HOMME", "FEMME", "BEBE" ou "UNISEXE"' 
})
```

### **Solution C : Problème de Base de Données**

Si le genre est traité mais pas sauvegardé :

```sql
-- Vérifiez que la colonne genre existe et a le bon type
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'Product' AND column_name = 'genre';
```

### **Solution D : Problème de Migration**

Si la migration n'a pas été appliquée :

```bash
# Appliquer la migration manuellement
npx prisma migrate dev --name add_genre_to_products

# Ou utiliser le script de migration manuelle
node apply-migration.js
```

## 🔧 Script de Test Rapide

Créez un fichier `test-quick-genre.js` :

```javascript
const axios = require('axios');

async function testQuick() {
  const testData = {
    name: 'Test Quick Genre',
    description: 'Test rapide du genre',
    price: 1000,
    stock: 10,
    status: 'published',
    isReadyProduct: true,
    genre: 'HOMME',
    categories: ['Test'],
    colorVariations: []
  };

  try {
    const response = await axios.post('http://localhost:3004/products/ready', {
      productData: JSON.stringify(testData)
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Produit créé:', response.data.genre);
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data);
  }
}

testQuick();
```

## 📊 Résultats Attendus

### **Logs Backend Corrects**
```
🔍 [CONTROLLER] createReadyProduct - Genre reçu: HOMME
🔍 [CONTROLLER] createReadyProduct - Genre est-il défini? true
🔍 [BACKEND] createReadyProduct - Genre avant création: HOMME
💾 Produit créé avec genre: HOMME
💾 Produit créé - Genre est-il correct? true
```

### **Base de Données Correcte**
```sql
SELECT name, genre FROM "Product" WHERE name = 'Test Quick Genre';
-- Résultat attendu: genre = 'HOMME'
```

### **Réponse API Correcte**
```json
{
  "id": 123,
  "name": "Test Quick Genre",
  "genre": "HOMME",
  "isReadyProduct": true
}
```

## 🚨 Actions Immédiates

1. **Démarrer le serveur avec les nouveaux logs**
2. **Créer un produit prêt avec le frontend**
3. **Vérifier les logs du serveur**
4. **Exécuter le script de test**
5. **Vérifier la base de données**

---

**Contact :** Une fois le diagnostic effectué, partagez les résultats pour identifier la cause exacte du problème. 