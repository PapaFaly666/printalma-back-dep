# 🔧 Guide Frontend : Upload direct d'images de couleur

## 🎯 Endpoint disponible

**Upload direct d'image de couleur lors de la modification de produit**

```typescript
POST /products/upload-color-image/:productId/:colorId
Content-Type: multipart/form-data
```

---

## 📋 Paramètres

### **URL Parameters**
- `productId` : ID du produit (number)
- `colorId` : ID de la couleur (number)

### **Body (FormData)**
- `image` : Fichier image (File) - JPG, PNG, WEBP

---

## 🔧 Implémentation Frontend - Upload Direct

### 1. **Fonction d'upload direct (sans stockage local)**

```jsx
const uploadColorImageDirect = async (productId: number, colorId: number, imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`/products/upload-color-image/${productId}/${colorId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
        // Ne pas mettre Content-Type, il est géré automatiquement par FormData
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'upload de l\'image');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erreur upload image couleur:', error);
    throw error;
  }
};
```

### 2. **Composant d'upload direct pour modification**

```jsx
import React, { useState, useCallback } from 'react';

function ColorImageUploader({ productId, colorId, onImageUploaded }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validation du fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Format d\'image non supporté. Utilisez JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      setUploadError('L\'image est trop volumineuse. Taille maximum: 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // ✅ Upload direct sur le serveur
      const result = await uploadColorImageDirect(productId, colorId, file);
      
      // ✅ Succès - Notifier le parent
      if (onImageUploaded) {
        onImageUploaded(result.image);
      }

      console.log('Image uploadée avec succès:', result);
    } catch (error) {
      console.error('Erreur upload:', error);
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  }, [productId, colorId, onImageUploaded]);

  return (
    <div className="color-image-uploader">
      <div className="upload-area">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={isUploading}
          id={`color-image-${colorId}`}
        />
        <label htmlFor={`color-image-${colorId}`}>
          {isUploading ? 'Upload en cours...' : 'Ajouter une image'}
        </label>
      </div>

      {uploadError && (
        <div className="error-message">
          {uploadError}
        </div>
      )}

      {isUploading && (
        <div className="upload-progress">
          <div className="spinner"></div>
          <span>Upload en cours...</span>
        </div>
      )}
    </div>
  );
}
```

### 3. **Utilisation dans le formulaire de modification**

```jsx
function ProductEditForm({ product }) {
  const [productData, setProductData] = useState(product);

  const handleColorImageUploaded = useCallback((newImage, colorId) => {
    // ✅ Mettre à jour l'état local avec la nouvelle image
    setProductData(prev => ({
      ...prev,
      colorVariations: prev.colorVariations.map(cv => 
        cv.id === colorId 
          ? { ...cv, images: [...cv.images, newImage] }
          : cv
      )
    }));
  }, []);

  return (
    <form>
      {productData.colorVariations.map(colorVariation => (
        <div key={colorVariation.id}>
          <h3>{colorVariation.name}</h3>
          
          {/* Images existantes */}
          <div className="existing-images">
            {colorVariation.images.map(image => (
              <img key={image.id} src={image.url} alt={colorVariation.name} />
            ))}
          </div>

          {/* Upload de nouvelle image - DIRECT sur serveur */}
          <ColorImageUploader
            productId={product.id}
            colorId={colorVariation.id}
            onImageUploaded={(newImage) => handleColorImageUploaded(newImage, colorVariation.id)}
          />
        </div>
      ))}
    </form>
  );
}
```

### 4. **Gestion avec drag & drop (upload direct)**

```jsx
const handleDrop = async (event) => {
  event.preventDefault();
  
  const files = event.dataTransfer.files;
  if (files.length === 0) return;

  const file = files[0];
  
  // ✅ Upload direct sans stockage local
  try {
    const result = await uploadColorImageDirect(productId, colorId, file);
    
    // ✅ Mettre à jour l'interface
    if (onImageUploaded) {
      onImageUploaded(result.image);
    }
  } catch (error) {
    console.error('Erreur upload:', error);
    setUploadError(error.message);
  }
};

const handleDragOver = (event) => {
  event.preventDefault();
};

return (
  <div
    onDrop={handleDrop}
    onDragOver={handleDragOver}
    style={{
      border: '2px dashed #ccc',
      padding: '20px',
      textAlign: 'center',
      cursor: 'pointer'
    }}
  >
    <p>Glissez-déposez une image ici pour l'uploader directement</p>
    <input
      type="file"
      onChange={handleFileSelect}
      accept="image/jpeg,image/png,image/webp"
      style={{ display: 'none' }}
      id="fileInput"
    />
    <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
      Sélectionner une image
    </label>
  </div>
);
```

---

## 📋 Réponse de l'API

### ✅ **Succès (201)**
```json
{
  "success": true,
  "message": "Image uploadée avec succès",
  "image": {
    "id": 123,
    "url": "https://res.cloudinary.com/.../image.jpg",
    "publicId": "printalma/1234567890-image.jpg",
    "view": "Front",
    "colorVariationId": 456,
    "delimitations": []
  }
}
```

### ❌ **Erreurs possibles**

#### **400 - Bad Request**
```json
{
  "statusCode": 400,
  "message": "Format d'image non supporté. Utilisez JPG, PNG ou WEBP."
}
```

#### **404 - Not Found**
```json
{
  "statusCode": 404,
  "message": "Produit ou couleur non trouvé"
}
```

#### **413 - Payload Too Large**
```json
{
  "statusCode": 413,
  "message": "Fichier trop volumineux"
}
```

---

## 🎨 Exemple complet avec gestion d'état

```jsx
import React, { useState, useCallback } from 'react';

function ColorImageUploader({ productId, colorId, onImageUploaded }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const uploadImage = useCallback(async (file) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/products/upload-color-image/${productId}/${colorId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      
      // ✅ Notifier le parent avec l'image uploadée
      if (onImageUploaded) {
        onImageUploaded(result.image);
      }

      return result;
    } catch (error) {
      setUploadError(error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [productId, colorId, onImageUploaded]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Format d\'image non supporté. Utilisez JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('L\'image est trop volumineuse. Taille maximum: 5MB.');
      return;
    }

    try {
      await uploadImage(file);
    } catch (error) {
      console.error('Erreur upload:', error);
    }
  };

  return (
    <div className="color-image-uploader">
      <div className="upload-area">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={isUploading}
          id={`color-image-${colorId}`}
        />
        <label htmlFor={`color-image-${colorId}`}>
          {isUploading ? 'Upload en cours...' : 'Ajouter une image'}
        </label>
      </div>

      {uploadError && (
        <div className="error-message">
          {uploadError}
        </div>
      )}

      {isUploading && (
        <div className="upload-progress">
          <div className="spinner"></div>
          <span>Upload en cours...</span>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Utilisation dans le formulaire de modification

```jsx
function ProductEditForm({ product }) {
  const [productData, setProductData] = useState(product);

  const handleColorImageUploaded = useCallback((newImage, colorId) => {
    setProductData(prev => ({
      ...prev,
      colorVariations: prev.colorVariations.map(cv => 
        cv.id === colorId 
          ? { ...cv, images: [...cv.images, newImage] }
          : cv
      )
    }));
  }, []);

  return (
    <form>
      {productData.colorVariations.map(colorVariation => (
        <div key={colorVariation.id}>
          <h3>{colorVariation.name}</h3>
          
          {/* Images existantes */}
          <div className="existing-images">
            {colorVariation.images.map(image => (
              <img key={image.id} src={image.url} alt={colorVariation.name} />
            ))}
          </div>

          {/* Upload de nouvelle image - DIRECT sur serveur */}
          <ColorImageUploader
            productId={product.id}
            colorId={colorVariation.id}
            onImageUploaded={(newImage) => handleColorImageUploaded(newImage, colorVariation.id)}
          />
        </div>
      ))}
    </form>
  );
}
```

---

## ✅ Résumé

1. **✅ Upload direct** : Image uploadée immédiatement sur Cloudinary
2. **✅ Pas de stockage local** : L'image va directement sur le serveur
3. **✅ Feedback immédiat** : L'utilisateur voit l'image uploadée
4. **✅ Validation** : Formats JPG, PNG, WEBP acceptés
5. **✅ Gestion d'erreur** : Messages d'erreur clairs

**L'upload direct d'images de couleur est maintenant disponible !** 🎉 