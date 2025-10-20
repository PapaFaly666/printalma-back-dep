# 🖼️ Solution - Erreur FileId Images Non Trouvées

## ❌ Problème

```
POST https://printalma-back-dep.onrender.com/products 400 (Bad Request)
Error: Image with fileId "1760921391982" not found in uploaded files.
```

## 🔍 Cause

Le `fileId` spécifié dans `colorVariations.images` ne correspond à aucun fichier uploadé sur le serveur.

**Payload envoyé :**
```json
{
  "colorVariations": [
    {
      "images": [
        {
          "fileId": "1760921391982",  // ❌ Ce fichier n'existe pas sur le serveur
          "view": "Front"
        }
      ]
    }
  ]
}
```

---

## ✅ Solutions Possibles

### Solution 1 : Upload des Images en Deux Étapes (Recommandé)

#### Étape 1 : Uploader les images d'abord

```typescript
// 1. Uploader les images AVANT de créer le produit
async function uploadImages(images: File[]): Promise<string[]> {
  const formData = new FormData();
  
  images.forEach(image => {
    formData.append('files', image);
  });

  const response = await fetch(`${API_URL}/upload/images`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Erreur lors de l\'upload des images');
  }

  const result = await response.json();
  return result.fileIds; // Retourne les IDs des fichiers uploadés
}
```

#### Étape 2 : Utiliser les fileIds retournés

```typescript
async createProduct(productData: any, images: File[]): Promise<any> {
  // 1. Uploader les images d'abord
  console.log('📤 Upload des images...');
  const uploadedFileIds = await uploadImages(images);
  console.log('✅ Images uploadées:', uploadedFileIds);

  // 2. Construire le payload avec les vrais fileIds
  const backendProductData = {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    categoryId: productData.categoryId,
    subCategoryId: productData.subCategoryId,
    categories: productData.categoryName 
      ? [productData.categoryName] 
      : ["Produit"],
    
    colorVariations: productData.variations?.map((v: any, index: number) => ({
      name: v.value,
      colorCode: v.colorCode,
      images: uploadedFileIds.map((fileId, imgIndex) => ({
        fileId: fileId,  // ✅ Utiliser les vrais fileIds
        view: v.images?.[imgIndex]?.view || "Front",
        delimitations: v.images?.[imgIndex]?.delimitations || []
      }))
    })) || [],
    
    genre: productData.genre || 'UNISEXE',
    isReadyProduct: productData.isReadyProduct || false,
    sizes: productData.sizes || []
  };

  // 3. Créer le produit (sans images dans FormData)
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(backendProductData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }

  return await response.json();
}
```

---

### Solution 2 : Upload Simultané (Si le Backend le Supporte)

Si le backend accepte les images dans le même FormData que le produit :

```typescript
async createProduct(productData: any, images: File[]): Promise<any> {
  const backendProductData = {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    categoryId: productData.categoryId,
    subCategoryId: productData.subCategoryId,
    categories: productData.categoryName 
      ? [productData.categoryName] 
      : ["Produit"],
    
    colorVariations: productData.variations?.map((v: any, index: number) => ({
      name: v.value,
      colorCode: v.colorCode,
      // ⚠️ Ne PAS mettre de fileId ici si on uploade en même temps
      images: images.map((img, imgIndex) => ({
        // Le backend générera les fileIds automatiquement
        view: v.images?.[imgIndex]?.view || "Front",
        delimitations: v.images?.[imgIndex]?.delimitations || []
      }))
    })) || [],
    
    genre: productData.genre || 'UNISEXE',
    isReadyProduct: productData.isReadyProduct || false,
    sizes: productData.sizes || []
  };

  const formData = new FormData();
  formData.append('productData', JSON.stringify(backendProductData));
  
  // Ajouter les images
  images.forEach((image) => {
    formData.append('images', image);
  });

  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }

  return await response.json();
}
```

---

### Solution 3 : Vérifier l'Endpoint d'Upload Backend

Vérifiez quel endpoint le backend expose pour l'upload d'images :

```bash
# Possibilités courantes :
POST /upload/images
POST /files/upload
POST /products/upload-images
```

**Test avec curl :**
```bash
curl -X POST http://localhost:3004/upload/images \
  -F "files=@image.jpg" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "fileIds": ["file_123", "file_456"],
  "files": [
    {
      "fileId": "file_123",
      "originalName": "image.jpg",
      "url": "https://..."
    }
  ]
}
```

---

## 🔧 Code Complet Recommandé

### Fichier : `productService.ts`

```typescript
class ProductService {
  private API_URL = 'http://localhost:3004';

  /**
   * Upload des images en premier
   */
  async uploadImages(images: File[]): Promise<UploadedFile[]> {
    const formData = new FormData();
    
    images.forEach(image => {
      formData.append('files', image);
    });

    console.log('📤 Upload de', images.length, 'images...');

    const response = await fetch(`${this.API_URL}/upload/images`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Erreur upload: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Images uploadées:', result);
    
    return result.files; // Retourne [{fileId, url, ...}, ...]
  }

  /**
   * Création du produit avec les fileIds des images uploadées
   */
  async createProduct(productData: any, images: File[]): Promise<any> {
    try {
      // 1️⃣ Uploader les images d'abord
      const uploadedFiles = await this.uploadImages(images);
      
      // 2️⃣ Mapper les images aux variations
      const colorVariations = productData.variations?.map((v: any) => {
        // Trouver les images pour cette variation
        const variationImages = v.images?.map((img: any, imgIndex: number) => {
          const uploadedFile = uploadedFiles[imgIndex];
          
          if (!uploadedFile) {
            throw new Error(`Image ${imgIndex} non trouvée dans les fichiers uploadés`);
          }

          return {
            fileId: uploadedFile.fileId,  // ✅ Utiliser le vrai fileId
            view: img.view || "Front",
            delimitations: img.delimitations || []
          };
        }) || [];

        return {
          name: v.value,
          colorCode: v.colorCode,
          images: variationImages
        };
      }) || [];

      // 3️⃣ Construire le payload final
      const backendProductData = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        suggestedPrice: productData.suggestedPrice,
        stock: productData.stock || 0,
        status: productData.status || 'draft',
        categoryId: productData.categoryId,
        subCategoryId: productData.subCategoryId,
        categories: productData.categoryName 
          ? [productData.categoryName] 
          : ["Produit"],
        colorVariations,
        genre: productData.genre || 'UNISEXE',
        isReadyProduct: productData.isReadyProduct || false,
        sizes: productData.sizes || []
      };

      console.log('📦 Payload final:', backendProductData);

      // 4️⃣ Créer le produit
      const response = await fetch(`${this.API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendProductData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const result = await response.json();
      console.log('✅ Produit créé:', result);
      
      return result;

    } catch (error) {
      console.error('❌ Erreur création produit:', error);
      throw error;
    }
  }
}

interface UploadedFile {
  fileId: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
}

export const productService = new ProductService();
```

---

## 🧪 Test de l'Upload

### Test 1 : Vérifier l'endpoint d'upload

```typescript
// Test dans la console du navigateur
const testUpload = async () => {
  const formData = new FormData();
  const file = document.querySelector('input[type="file"]').files[0];
  formData.append('files', file);

  const response = await fetch('http://localhost:3004/upload/images', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  console.log('Résultat upload:', result);
};

testUpload();
```

### Test 2 : Vérifier le format de réponse

La réponse devrait ressembler à :
```json
{
  "success": true,
  "files": [
    {
      "fileId": "1234567890",
      "originalName": "image.jpg",
      "url": "https://storage.../image.jpg",
      "size": 207501,
      "mimeType": "image/jpeg"
    }
  ]
}
```

---

## 📋 Checklist de Débogage

- [ ] Vérifier quel endpoint le backend expose pour l'upload
- [ ] Tester l'upload d'images séparément
- [ ] Vérifier le format de la réponse d'upload
- [ ] Utiliser les `fileId` retournés par l'upload
- [ ] Vérifier que les images sont bien associées aux variations
- [ ] Tester la création du produit avec les vrais fileIds

---

## 🎯 Résumé

**Problème** : FileId non trouvé car l'image n'est pas uploadée

**Solution** :
1. Uploader les images **AVANT** de créer le produit
2. Récupérer les `fileId` retournés par l'upload
3. Utiliser ces `fileId` dans `colorVariations.images`
4. Créer le produit avec les vrais fileIds

**Flux recommandé** :
```
1. User sélectionne images
2. Upload images → Backend retourne fileIds
3. Construire payload avec fileIds
4. Créer produit → Success ✅
```

---

**Résultat attendu** : HTTP 201 Created ✅
