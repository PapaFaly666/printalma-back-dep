# Guide Frontend - Upload SVG pour Contenu Page d'Accueil

## 📋 Vue d'ensemble

Ce guide explique comment gérer l'upload de fichiers **SVG** pour le contenu de la page d'accueil depuis le frontend.

**Endpoint:** `POST /api/admin/content/upload`

**Formats supportés:** JPG, PNG, **SVG**, WEBP (max 5MB)

---

## 🎨 Spécificités des SVG

### Pourquoi les SVG sont différents ?

| Caractéristique | Images raster (JPG, PNG) | SVG |
|----------------|------------------------|-----|
| Type | Image bitmap | Image vectorielle |
| Redimensionnement | Perte de qualité | Aucune perte |
| Taille | Dépend de la résolution | Taille fixe (fichier texte) |
| Transformations Cloudinary | Optimisation auto | Aucune (préservé tel quel) |
| MIME types | Uniques | Multiples (image/svg+xml, text/xml, text/plain) |

### Formats supportés

```
✅ .svg   → image/svg+xml
✅ .svg   → text/xml
✅ .svg   → text/plain (accepté par extension)
```

---

## 🔌 API Endpoint

### POST /admin/content/upload

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `section` (requis): `designs` | `influencers` | `merchandising`

**Request:** Multipart form-data
- `file`: Fichier image (jpg, png, svg, webp)
- Taille max: 5MB

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/.../image.svg",
    "publicId": "home_content/designs/abc123..."
  }
}
```

---

## 💻 Implémentation React

### Hook d'upload avec support SVG

```typescript
import { useState } from 'react';

interface UploadOptions {
  token: string;
  section: 'designs' | 'influencers' | 'merchandising';
  onUploadStart?: () => void;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
}

export const useImageUpload = ({ token, section, onUploadStart, onUploadSuccess, onUploadError }: UploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File): Promise<string> => {
    // État initial
    setUploading(true);
    setProgress(0);
    onUploadStart?.();

    try {
      // Validation côté client
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Détecter si c'est un SVG
      const isSvg = file.name.toLowerCase().endsWith('.svg');
      console.log(`📤 Upload ${isSvg ? 'SVG' : 'image'}: ${file.name} (${formatFileSize(file.size)})`);

      // Créer le FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload avec progress
      const xhr = new XMLHttpRequest();

      // Upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
          console.log(`📊 Progression: ${percentComplete}%`);
        }
      });

      // Promesse pour l'upload
      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              const url = response.data.url;
              console.log('✅ Upload réussi:', url);
              onUploadSuccess?.(url);
              resolve(url);
            } else {
              reject(new Error(response.message || 'Erreur upload'));
            }
          } else {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || `Erreur ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Erreur réseau lors de l\'upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload annulé'));
        });

        // Envoyer la requête
        xhr.open('POST', `https://api.printalma.com/api/admin/content/upload?section=${section}`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      const url = await uploadPromise;
      return url;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur upload:', errorMsg);
      onUploadError?.(errorMsg);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadImage,
    uploading,
    progress,
  };
};

/**
 * Validation du fichier avant upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Vérifier l'extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.webp'];
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Format non supporté. Utilisez JPG, PNG, SVG ou WEBP (fichier: ${file.name})`
    };
  }

  // Vérifier la taille (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux (${formatFileSize(file.size)}). Max: 5MB`
    };
  }

  // Vérifier que le fichier n'est pas vide
  if (file.size === 0) {
    return {
      valid: false,
      error: 'Fichier vide'
    };
  }

  return { valid: true };
}

/**
 * Formater la taille du fichier pour l'affichage
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
```

---

## 🎨 Composant d'Upload avec Support SVG

### Composant complet

```typescript
import React, { useRef, useState } from 'react';
import { useImageUpload } from './useImageUpload';

interface ImageUploadProps {
  token: string;
  section: 'designs' | 'influencers' | 'merchandising';
  currentImageUrl?: string;
  onUrlChange: (url: string) => void;
  label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  token,
  section,
  currentImageUrl,
  onUrlChange,
  label = 'Changer l\'image',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { uploadImage, uploading, progress } = useImageUpload({
    token,
    section,
    onUploadStart: () => {
      setError(null);
    },
    onUploadSuccess: (url) => {
      setPreviewUrl(null);
      onUrlChange(url);
    },
    onUploadError: (errorMsg) => {
      setError(errorMsg);
      // Garder le preview en cas d'erreur pour permettre de réessayer
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Créer un preview local
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      await uploadImage(file);
    } catch (err) {
      // Le preview reste affiché en cas d'erreur
      console.error('Upload failed:', err);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const isSvg = currentImageUrl?.toLowerCase().endsWith('.svg') ||
                previewUrl?.toLowerCase().endsWith('.svg');

  return (
    <div className="image-upload">
      {/* Preview de l'image */}
      {(currentImageUrl || previewUrl) && (
        <div className="image-preview">
          <img
            src={previewUrl || currentImageUrl}
            alt="Preview"
            className={isSvg ? 'svg-preview' : 'raster-preview'}
          />
          {isSvg && (
            <span className="svg-badge">SVG</span>
          )}
        </div>
      )}

      {/* Barre de progression */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="upload-error">
          ❌ {error}
          <button onClick={() => setError(null)}>Fermer</button>
        </div>
      )}

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp,.svg"
        disabled={uploading}
        style={{ display: 'none' }}
      />

      {/* Bouton d'upload */}
      <button
        onClick={handleClick}
        disabled={uploading}
        className="upload-button"
      >
        {uploading ? 'Upload en cours...' : label}
      </button>

      {/* Info formats */}
      <div className="upload-info">
        <small>Formats acceptés: JPG, PNG, SVG, WEBP (max 5MB)</small>
      </div>
    </div>
  );
};
```

---

## 📝 Styles CSS

```css
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-preview {
  position: relative;
  width: 200px;
  height: 200px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-preview .svg-preview {
  /* Pour les SVG, on utilise contain pour préserver les proportions */
  object-fit: contain;
}

.image-preview .raster-preview {
  /* Pour les images raster, on peut utiliser cover */
  object-fit: cover;
}

.svg-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0d6efd, #0b5ed7);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #6c757d;
  min-width: 40px;
}

.upload-error {
  padding: 12px;
  background: #f8d7da;
  border: 1px solid #f5c2c7;
  border-radius: 6px;
  color: #842029;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-error button {
  background: none;
  border: none;
  color: #842029;
  text-decoration: underline;
  cursor: pointer;
  font-size: 12px;
}

.upload-button {
  padding: 10px 20px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.upload-button:hover:not(:disabled) {
  background: #0b5ed7;
}

.upload-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.upload-info {
  text-align: center;
}

.upload-info small {
  color: #6c757d;
  font-size: 12px;
}
```

---

## 🧪 Tests

### Test manuel

```typescript
// Test d'upload SVG
const testSvgUpload = async () => {
  // Créer un SVG de test
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <circle cx="50" cy="50" r="40" fill="red"/>
    </svg>
  `;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const file = new File([blob], 'test.svg', { type: 'image/svg+xml' });

  try {
    const url = await uploadImage(file);
    console.log('SVG uploadé:', url);
    // Vérifier que l'URL se termine par .svg
    console.assert(url.endsWith('.svg'), 'L\'URL devrait se terminer par .svg');
  } catch (error) {
    console.error('Test échoué:', error);
  }
};
```

### Test avec différents formats

```typescript
const testAllFormats = async () => {
  const formats = [
    { name: 'image.jpg', type: 'image/jpeg', size: 1024 * 100 },
    { name: 'image.png', type: 'image/png', size: 1024 * 100 },
    { name: 'image.svg', type: 'image/svg+xml', size: 1024 * 10 },
    { name: 'image.webp', type: 'image/webp', size: 1024 * 50 },
  ];

  for (const format of formats) {
    console.log(`🧪 Test format: ${format.name}`);
    // Simuler l'upload et vérifier le résultat
  }
};
```

---

## 📊 Exemples d'utilisation

### 1. Upload simple

```typescript
const MyComponent = () => {
  const [imageUrl, setImageUrl] = useState('');
  const token = localStorage.getItem('token') || '';

  return (
    <ImageUpload
      token={token}
      section="designs"
      currentImageUrl={imageUrl}
      onUrlChange={setImageUrl}
    />
  );
};
```

### 2. Upload avec gestion d'erreur

```typescript
const MyComponent = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const token = localStorage.getItem('token') || '';

  return (
    <div>
      <ImageUpload
        token={token}
        section="designs"
        currentImageUrl={imageUrl}
        onUrlChange={(url) => {
          setImageUrl(url);
          setUploadError(null);
        }}
        onUploadError={(error) => {
          setUploadError(error);
        }}
      />
      {uploadError && <div className="error">{uploadError}</div>}
    </div>
  );
};
```

### 3. Upload avec prévisualisation

```typescript
const MyComponent = () => {
  const [items, setItems] = useState([
    { id: '1', name: 'Item 1', imageUrl: '' },
  ]);
  const token = localStorage.getItem('token') || '';

  const handleUpdateItem = (index: number, field: string, value: string) => {
    setItems(items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div>
      {items.map((item, index) => (
        <div key={item.id}>
          <input
            type="text"
            value={item.name}
            onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
          />
          <ImageUpload
            token={token}
            section="designs"
            currentImageUrl={item.imageUrl}
            onUrlChange={(url) => handleUpdateItem(index, 'imageUrl', url)}
          />
          {item.imageUrl && (
            <img src={item.imageUrl} alt={item.name} style={{ maxWidth: 100 }} />
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 🐛 Résolution des problèmes

### Problème 1: SVG non reconnu

**Symptôme:** L'upload échoue avec "Format non supporté"

**Solution:** Vérifier que l'attribut `accept` inclut bien les SVG:

```typescript
<input
  type="file"
  accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp,.svg"
  //                                                               ^^^^^ Ajouter .svg
/>
```

### Problème 2: Preview ne s'affiche pas

**Symptôme:** L'image SVG ne s'affiche pas dans le preview

**Solution:** Utiliser `object-fit: contain` pour les SVG:

```css
.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Important pour SVG */
}
```

### Problème 3: Upload lent pour les SVG

**Symptôme:** L'upload semble bloqué pour les gros SVG

**Cause:** Les SVG peuvent être plus volumineux que les images raster

**Solution:** Compresser le SVG avant upload (optionnel):

```typescript
const compressSvg = async (svgContent: string): Promise<string> => {
  // Supprimer les commentaires et espaces inutiles
  return svgContent
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};
```

---

## 📋 Checklist d'intégration

Avant de mettre en production:

- [ ] L'attribut `accept` inclut `.svg`
- [ ] La validation vérifie l'extension du fichier
- [ ] Le preview utilise `object-fit: contain`
- [ ] La taille max est vérifiée (5MB)
- [ ] Les erreurs sont affichées clairement
- [ ] La progression est affichée pendant l'upload
- [ ] Le SVG badge est affiché pour identifier les SVG
- [ ] L'URL retournée est bien utilisée pour mettre à jour le contenu

---

## 🔄 Workflow complet d'upload SVG

```
1. Utilisateur sélectionne un fichier .svg
   ↓
2. Frontend: Validation (extension, taille)
   ↓
3. Frontend: Création preview local (object URL)
   ↓
4. Frontend: POST /admin/content/upload?section=designs
   ↓
5. Backend: Détection SVG (MIME type ou extension)
   ↓
6. Backend: Configuration Cloudinary (pas de transformations)
   ↓
7. Cloudinary: Stockage du fichier SVG
   ↓
8. Backend: Retour URL sécurisée
   ↓
9. Frontend: Mise à jour avec l'URL Cloudinary
   ↓
10. Frontend: Suppression preview local
   ↓
11. Frontend: Affichage du SVG depuis Cloudinary
```

---

## 💡 Conseils d'UX

### 1. Indicateur visuel pour SVG

Affichez un badge "SVG" pour différencier les images vectorielles:

```typescript
{currentImageUrl?.endsWith('.svg') && (
  <span className="svg-badge">Vectoriel</span>
)}
```

### 2. Avertissement pour gros fichiers

```typescript
if (file.size > 1024 * 1024) { // > 1MB
  const confirm = window.confirm(
    `Ce fichier est volumineux (${formatFileSize(file.size)}). ` +
    `Voulez-vous continuer?`
  );
  if (!confirm) return;
}
```

### 3. Prévisualisation avant upload

```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Créer un preview local immédiat
  const localUrl = URL.createObjectURL(file);
  setPreviewUrl(localUrl);

  // Demander confirmation
  const confirmed = window.confirm(
    `Voulez-vous vraiment uploader "${file.name}" ?`
  );

  if (confirmed) {
    uploadImage(file);
  } else {
    URL.revokeObjectURL(localUrl);
    setPreviewUrl(null);
  }
};
```

---

**Version:** 1.0.0
**Date:** 2026-02-06
**Backend Version:** Compatible avec l'API v1.0

## ⚠️ RAPPELS IMPORTANTS

1. Les **SVG sont acceptés** avec l'extension `.svg`
2. Taille maximale: **5MB** pour tous les formats
3. Les SVG sont uploadés **sans transformations** (préservés tels quels)
4. Utilisez `object-fit: contain` pour l'affichage des SVG
5. L'URL retournée se termine par `.svg` pour les fichiers SVG
