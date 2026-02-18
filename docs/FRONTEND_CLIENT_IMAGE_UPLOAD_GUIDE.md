# Guide Frontend - Upload d'Images Clients

## 📋 Vue d'ensemble

Ce guide explique comment intégrer l'upload d'images clients dans le frontend de Printalma pour permettre aux utilisateurs d'uploader leurs propres images lors de la personnalisation de produits.

---

## 🎯 Fonctionnalités

- **Upload d'images** : Les clients peuvent uploader leurs propres images (JPEG, PNG, GIF, WebP)
- **Authentification optionnelle** : Fonctionne pour les utilisateurs connectés et les guests
- **Stockage Cloudinary** : Les images sont stockées de manière permanente sur Cloudinary
- **Tracking** : Les images sont trackées par utilisateur ou session
- **Nettoyage automatique** : Les images orphelines sont supprimées après 7 jours

---

## 🔌 Endpoint API

### POST /customizations/upload-image

Upload une image client vers Cloudinary.

#### Headers
```http
Content-Type: multipart/form-data
Authorization: Bearer <token> (optionnel - peut être un guest)
```

#### Body (multipart/form-data)
```
file: File (image/* - max 10MB)
```

#### Response Success (200)
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/client-uploads/user_5_1234567890_abc123def456.jpg",
  "publicId": "client-uploads/user_5_1234567890_abc123def456",
  "width": 1920,
  "height": 1080
}
```

#### Response Error (400/500)
```json
{
  "statusCode": 400,
  "message": "Type de fichier invalide: image/svg+xml. Formats acceptés: image/jpeg, image/png, image/gif, image/webp"
}
```

---

## 💻 Implémentation Frontend

### 1. Service d'Upload (TypeScript)

```typescript
// src/services/customization-image.service.ts

import axios from 'axios';
import { getToken } from '@/utils/auth'; // Votre fonction pour récupérer le token

export interface UploadedImage {
  success: boolean;
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export interface UploadImageOptions {
  onProgress?: (progress: number) => void;
}

class CustomizationImageService {
  private readonly baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

  /**
   * Upload une image client pour la personnalisation
   */
  async uploadClientImage(
    file: File,
    options?: UploadImageOptions
  ): Promise<UploadedImage> {
    // Validation côté client
    this.validateImageFile(file);

    // Créer le FormData
    const formData = new FormData();
    formData.append('file', file);

    // Ajouter le sessionId si c'est un guest
    const sessionId = this.getSessionId();
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    try {
      const response = await axios.post<UploadedImage>(
        `${this.baseURL}/customizations/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            // Authorization optionnelle (axios gérera le header si le token existe)
            ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
          },
          onUploadProgress: (progressEvent) => {
            if (options?.onProgress && progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              options.onProgress(progress);
            }
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur upload image:', error);
      throw this.handleUploadError(error);
    }
  }

  /**
   * Valider le fichier image avant upload
   */
  private validateImageFile(file: File): void {
    // Vérifier le type MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Type de fichier non supporté. Formats acceptés: JPEG, PNG, GIF, WebP`
      );
    }

    // Vérifier la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(
        `Fichier trop volumineux. Maximum: 10MB (votre fichier: ${this.formatFileSize(file.size)})`
      );
    }

    // Vérifier les dimensions (optionnel)
    return this.checkImageDimensions(file);
  }

  /**
   * Vérifier les dimensions de l'image
   */
  private async checkImageDimensions(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Dimensions max (4096x4096 selon la config Cloudinary)
        if (img.width > 4096 || img.height > 4096) {
          reject(
            new Error(
              `Image trop grande. Dimensions maximum: 4096x4096 pixels (votre image: ${img.width}x${img.height})`
            )
          );
        } else {
          resolve();
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Impossible de lire l\'image. Vérifiez que le fichier est valide.'));
      };

      img.src = url;
    });
  }

  /**
   * Récupérer ou générer un ID de session guest
   */
  private getSessionId(): string | undefined {
    // Récupérer depuis localStorage ou générer un nouveau
    let sessionId = localStorage.getItem('guest_session_id');

    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('guest_session_id', sessionId);
    }

    return sessionId;
  }

  /**
   * Formater la taille du fichier pour l'affichage
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * Gérer les erreurs d'upload
   */
  private handleUploadError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;

      // Messages d'erreur personnalisés
      if (message.includes('File size exceeds')) {
        return new Error('Le fichier est trop volumineux (max 10MB)');
      }
      if (message.includes('Invalid file type')) {
        return new Error('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP');
      }
      if (message.includes('No file provided')) {
        return new Error('Aucun fichier sélectionné');
      }

      return new Error(message);
    }

    return new Error('Une erreur est survenue lors de l\'upload');
  }
}

export const customizationImageService = new CustomizationImageService();
```

---

### 2. Hook React pour l'Upload

```typescript
// src/hooks/useImageUpload.ts

import { useState, useCallback } from 'react';
import { customizationImageService, UploadedImage } from '@/services/customization-image.service';

interface UseImageUploadResult {
  uploadImage: (file: File) => Promise<UploadedImage>;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  clearError: () => void;
}

export function useImageUpload(): UseImageUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File): Promise<UploadedImage> => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const result = await customizationImageService.uploadClientImage(file, {
        onProgress: (progress) => setUploadProgress(progress),
      });

      setUploadProgress(100);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      // Reset progress après un délai
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    uploadImage,
    isUploading,
    uploadProgress,
    error,
    clearError,
  };
}
```

---

### 3. Composant d'Upload

```typescript
// src/components/design-editor/ClientImageUpload.tsx

import React, { useRef, useState } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface ClientImageUploadProps {
  onImageUploaded: (imageData: {
    id: string;
    type: 'image';
    imageUrl: string;
    cloudinaryPublicId: string;
    isClientUpload: boolean;
    width: number;
    height: number;
    naturalWidth: number;
    naturalHeight: number;
    x: number;
    y: number;
    rotation: number;
    zIndex: number;
  }) => void;
  disabled?: boolean;
}

export function ClientImageUpload({ onImageUploaded, disabled }: ClientImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading, uploadProgress, error, clearError } = useImageUpload();
  const [dragActive, setDragActive] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (file: File) => {
    try {
      const result = await uploadImage(file);

      // Créer l'élément d'image pour le design
      const imageElement = {
        id: `client-img-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: 'image' as const,
        imageUrl: result.url,
        cloudinaryPublicId: result.publicId,
        isClientUpload: true,
        width: 200, // Largeur initiale (sera ajustable par l'utilisateur)
        height: 200 * (result.height / result.width), // Ratio préservé
        naturalWidth: result.width,
        naturalHeight: result.height,
        x: 0.5, // Centre du canvas (50%)
        y: 0.5, // Centre du canvas (50%)
        rotation: 0,
        zIndex: 1,
      };

      onImageUploaded(imageElement);
      clearError();
    } catch (err) {
      // L'erreur est déjà gérée par le hook
      console.error('Upload error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <button
        onClick={handleClick}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        disabled={disabled || isUploading}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all
          ${dragActive
            ? 'bg-blue-100 border-2 border-blue-500 scale-105'
            : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent'
          }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-700">
              Upload {uploadProgress > 0 && `(${uploadProgress}%)`}
            </span>
          </>
        ) : (
          <>
            <ImagePlus className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">Ajouter une image</span>
          </>
        )}
      </button>

      {dragActive && !disabled && !isUploading && (
        <div className="absolute inset-0 -m-2 rounded-lg border-2 border-dashed border-blue-500 bg-blue-50 flex items-center justify-center">
          <p className="text-blue-600 font-medium">Déposez l'image ici</p>
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
```

---

### 4. Intégration dans l'Éditeur de Design

```typescript
// src/components/design-editor/ProductDesignEditor.tsx

import React, { useState } from 'react';
import { ClientImageUpload } from './ClientImageUpload';
import { DesignCanvas } from './DesignCanvas';
import type { DesignElement } from '@/types/design';

export function ProductDesignEditor({ productId, viewId, colorVariationId }: Props) {
  const [designElements, setDesignElements] = useState<DesignElement[]>([]);

  const handleImageUploaded = (imageElement: DesignElement) => {
    // Ajouter l'image client au design
    setDesignElements(prev => [...prev, imageElement]);

    // Sauvegarder la personnalisation
    saveCustomization({
      productId,
      viewId,
      colorVariationId,
      designElements: [...designElements, imageElement],
    });
  };

  const handleSave = async () => {
    // Sauvegarder avec les images client incluses
    await saveCustomization({
      productId,
      viewId,
      colorVariationId,
      designElements,
    });
  };

  return (
    <div className="design-editor">
      <div className="toolbar">
        <ClientImageUpload
          onImageUploaded={handleImageUploaded}
          disabled={false}
        />

        {/* Autres outils de design */}
      </div>

      <DesignCanvas
        elements={designElements}
        onElementsChange={setDesignElements}
      />

      <button onClick={handleSave}>
        Sauvegarder le design
      </button>
    </div>
  );
}
```

---

## 📝 Structure des Données

### Élément Image Client (DesignElement)

```typescript
interface ClientImageElement extends DesignElement {
  id: string;                    // ID unique généré côté client
  type: 'image';                 // Type fixe
  imageUrl: string;              // URL Cloudinary
  cloudinaryPublicId: string;    // Public ID Cloudinary
  isClientUpload: true;          // Flag pour indiquer upload client

  // Dimensions affichées (ajustables)
  width: number;                 // Largeur affichée (pixels)
  height: number;                // Hauteur affichée (pixels)

  // Dimensions originales (read-only)
  naturalWidth: number;          // Largeur originale
  naturalHeight: number;         // Hauteur originale

  // Position et transformation
  x: number;                     // Position X (0-1 = 0%-100%)
  y: number;                     // Position Y (0-1 = 0%-100%)
  rotation: number;              // Rotation en degrés
  zIndex: number;                // Ordre d'empilement
}
```

### Exemple Complet

```json
{
  "id": "client-img-1706870400000-abc123def",
  "type": "image",
  "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1706870400/client-uploads/user_5_1706870400000_abc123def456.jpg",
  "cloudinaryPublicId": "client-uploads/user_5_1706870400000_abc123def456",
  "isClientUpload": true,
  "width": 200,
  "height": 150,
  "naturalWidth": 1920,
  "naturalHeight": 1440,
  "x": 0.5,
  "y": 0.5,
  "rotation": 0,
  "zIndex": 1
}
```

---

## 🔄 Différence Images Client vs Designs Vendeur

| Propriété | Image Client | Design Vendeur |
|-----------|-------------|---------------|
| **designId** | ❌ Absent | ✅ Présent |
| **designPrice** | ❌ Absent | ✅ Prix du design |
| **designName** | ❌ Absent | ✅ Nom du design |
| **vendorId** | ❌ Absent | ✅ ID du vendeur |
| **isClientUpload** | ✅ true | ❌ false/undefined |
| **cloudinaryPublicId** | ✅ Présent | ❌ Absent |
| **Coût pour client** | ✅ Gratuit | ✅ Prix du design |
| **Commission vendeur** | ❌ Aucune | ✅ Oui |

---

## 💰 Calcul des Prix

### Règles

- **Images client** : Gratuit (inclus dans le prix du produit)
- **Designs vendeur** : Prix du design ajouté au total

### Exemple de Calcul

```typescript
// Dans votre service de calcul de prix
function calculateDesignPrice(elements: DesignElement[]): number {
  let designsPrice = 0;

  for (const element of elements) {
    // Seulement les designs vendeur ajoutent au prix
    if (element.type === 'image' &&
        !element.isClientUpload &&
        element.designPrice) {
      designsPrice += element.designPrice;
    }

    // Les images client (isClientUpload: true) sont gratuites
  }

  return designsPrice;
}

// Exemple:
const elements = [
  { type: 'image', isClientUpload: true },      // Gratuit
  { type: 'image', designId: 123, designPrice: 2000 },  // +2000 FCFA
  { type: 'image', isClientUpload: true },      // Gratuit
  { type: 'image', designId: 456, designPrice: 1500 },  // +1500 FCFA
];

// Total designs: 3500 FCFA
// Les images client n'ajoutent rien au prix
```

---

## 🧪 Tests

### Test Manuel avec cURL

```bash
# Test avec utilisateur connecté
curl -X POST http://localhost:3004/customizations/upload-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg"

# Test en tant que guest
curl -X POST http://localhost:3004/customizations/upload-image \
  -F "file=@/path/to/image.jpg" \
  -F "sessionId=guest_abc123"

# Réponse attendue:
{
  "success": true,
  "url": "https://res.cloudinary.com/dsxab4qnu/...",
  "publicId": "client-uploads/user_5_...",
  "width": 1920,
  "height": 1080
}
```

### Tests Frontend

```typescript
// Dans vos tests
describe('ClientImageUpload', () => {
  it('devrait uploader une image avec succès', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

    const result = await customizationImageService.uploadClientImage(file);

    expect(result.success).toBe(true);
    expect(result.url).toContain('cloudinary.com');
    expect(result.publicId).toContain('client-uploads');
  });

  it('devrait rejeter un fichier trop volumineux', async () => {
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg');

    await expect(
      customizationImageService.uploadClientImage(largeFile)
    ).rejects.toThrow('Fichier trop volumineux');
  });

  it('devrait rejeter un type invalide', async () => {
    const pdfFile = new File([''], 'doc.pdf', { type: 'application/pdf' });

    await expect(
      customizationImageService.uploadClientImage(pdfFile)
    ).rejects.toThrow('Type de fichier non supporté');
  });
});
```

---

## ⚠️ Gestion des Erreurs

### Codes d'Erreur et Messages

| Code HTTP | Message | Action |
|-----------|---------|--------|
| 400 | No file provided | Demander à l'utilisateur de sélectionner un fichier |
| 400 | File size exceeds 10MB limit | Avertir que le fichier est trop grand |
| 400 | Invalid file type: ... | Afficher les formats acceptés |
| 500 | Image upload failed | Afficher une erreur générique et proposer de réessayer |

### Exemple de Gestion d'Erreur UI

```typescript
const handleUploadError = (error: Error) => {
  const toast = useToast();

  if (error.message.includes('trop volumineux')) {
    toast({
      title: 'Fichier trop grand',
      description: 'La taille maximum est de 10MB. Veuillez compresser votre image.',
      status: 'error',
    });
  } else if (error.message.includes('Type de fichier')) {
    toast({
      title: 'Format non supporté',
      description: 'Utilisez JPEG, PNG, GIF ou WebP.',
      status: 'error',
    });
  } else {
    toast({
      title: 'Erreur d\'upload',
      description: 'Veuillez réessayer.',
      status: 'error',
    });
  }
};
```

---

## 🚀 Bonnes Pratiques

### 1. Validation Côté Client

Toujours valider le fichier **avant** l'upload pour économiser de la bande passante et améliorer l'UX.

```typescript
// ✅ Bon : valider avant upload
const handleUpload = async (file: File) => {
  validateImageFile(file);  // Validation rapide côté client
  const result = await uploadImage(file);  // Upload
};
```

### 2. Progress Indicator

Afficher la progression de l'upload pour les grandes images.

```typescript
<ProgressBar value={uploadProgress} />
{uploadProgress > 0 && (
  <span>{uploadProgress}%</span>
)}
```

### 3. Preview Avant Upload

Montrer une preview de l'image avant de l'ajouter au design.

```typescript
const [preview, setPreview] = useState<string | null>(null);

const handleFileSelect = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => setPreview(e.target?.result as string);
  reader.readAsDataURL(file);
};
```

### 4. Gestion du Drag & Drop

Supporter le drag & drop pour une meilleure UX.

```typescript
<div
  onDragEnter={handleDragIn}
  onDragLeave={handleDragOut}
  onDrop={handleDrop}
>
  <DropZone />
</div>
```

### 5. Nettoyage des Sessions

Conserver l'ID de session pour les guests entre les pages.

```typescript
// Générer et conserver l'ID de session
const sessionId = localStorage.getItem('guest_session_id') ||
                  `guest_${Date.now()}_${Math.random().toString(36).substring(2)}`;
localStorage.setItem('guest_session_id', sessionId);
```

---

## 📚 Ressources

- **Documentation Backend** : `docs/BACKEND_CLIENT_IMAGE_UPLOAD_GUIDE.md`
- **API Endpoint** : `POST /customizations/upload-image`
- **DTO** : `ImageElementDto` dans `src/customization/dto/create-customization.dto.ts`
- **Service** : `CustomizationImageService` dans `src/customization/customization.service.ts`

---

**Date de création** : 2 février 2026
**Version** : 1.0.0
**Auteur** : Claude Sonnet 4.5
