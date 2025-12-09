# Guide d'Intégration Frontend - Système de Galerie Vendeur

Ce guide fournit toutes les informations nécessaires pour intégrer le système de galerie vendeur dans votre application frontend.

---

## 📋 Table des matières

1. [Configuration initiale](#configuration-initiale)
2. [Authentification](#authentification)
3. [Endpoints API](#endpoints-api)
4. [Types TypeScript](#types-typescript)
5. [Services/API Client](#servicesapi-client)
6. [Composants React exemples](#composants-react-exemples)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Bonnes pratiques](#bonnes-pratiques)

---

## Configuration initiale

### Variables d'environnement

```env
NEXT_PUBLIC_API_URL=http://localhost:3004
# ou
VITE_API_URL=http://localhost:3004
# ou
REACT_APP_API_URL=http://localhost:3004
```

### Base URL
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';
```

---

## Authentification

Tous les endpoints vendeur nécessitent un token JWT dans l'en-tête `Authorization`.

```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

**⚠️ Important**: Les endpoints publics (`/public/galleries`) ne nécessitent PAS d'authentification.

---

## Endpoints API

### 📌 Endpoints Vendeur (Protégés)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/vendor/galleries` | Créer une galerie | ✅ |
| GET | `/vendor/galleries` | Lister ses galeries | ✅ |
| GET | `/vendor/galleries/:id` | Voir une galerie | ✅ |
| PUT | `/vendor/galleries/:id` | Modifier une galerie | ✅ |
| DELETE | `/vendor/galleries/:id` | Supprimer une galerie | ✅ |
| PATCH | `/vendor/galleries/:id/publish` | Publier/Dépublier | ✅ |

### 🌍 Endpoints Publics (Sans auth)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/public/galleries` | Lister les galeries publiées | ❌ |
| GET | `/public/galleries/:id` | Voir une galerie publiée | ❌ |

---

## Types TypeScript

### Types de base

```typescript
// Énumérations
export enum GalleryStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

// Image de galerie
export interface GalleryImage {
  id: number;
  imageUrl: string;
  publicId: string;
  caption?: string;
  orderPosition: number;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  createdAt: string;
}

// Galerie complète
export interface Gallery {
  id: number;
  vendorId: number;
  title: string;
  description?: string;
  status: GalleryStatus;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  images: GalleryImage[];
  images_count?: number;
}

// Informations vendeur (pour les endpoints publics)
export interface VendorInfo {
  id: number;
  firstName: string;
  lastName: string;
  shop_name?: string;
  avatar?: string;
}

// Galerie avec info vendeur (endpoints publics)
export interface PublicGallery extends Gallery {
  vendor: VendorInfo;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Réponse API paginée
export interface PaginatedGalleriesResponse {
  success: boolean;
  data: {
    galleries: Gallery[] | PublicGallery[];
    pagination: Pagination;
  };
}

// Réponse API simple
export interface GalleryResponse {
  success: boolean;
  message?: string;
  data?: Gallery;
}

// DTOs pour les requêtes
export interface CreateGalleryDto {
  title: string;
  description?: string;
  captions?: Array<{ caption?: string }>;
  images: File[]; // 5 fichiers exactement
}

export interface UpdateGalleryDto {
  title?: string;
  description?: string;
  status?: GalleryStatus;
  is_published?: boolean;
}

export interface TogglePublishDto {
  is_published: boolean;
}
```

---

## Services/API Client

### Service complet pour les galeries

```typescript
// services/galleryService.ts
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class GalleryService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
    });
  }

  // Définir le token d'authentification
  setAuthToken(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Supprimer le token
  clearAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // ========== ENDPOINTS VENDEUR (Protégés) ==========

  /**
   * Créer une nouvelle galerie
   * @param data Données de la galerie (titre, description, images, captions)
   * @returns Promise<GalleryResponse>
   */
  async createGallery(data: CreateGalleryDto): Promise<GalleryResponse> {
    if (data.images.length !== 5) {
      throw new Error('Une galerie doit contenir exactement 5 images');
    }

    const formData = new FormData();
    formData.append('title', data.title);

    if (data.description) {
      formData.append('description', data.description);
    }

    // Ajouter les images
    data.images.forEach((image) => {
      formData.append('images', image);
    });

    // Ajouter les légendes (optionnel)
    if (data.captions && data.captions.length > 0) {
      formData.append('captions', JSON.stringify(data.captions));
    }

    const response = await this.api.post('/vendor/galleries', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Récupérer toutes les galeries du vendeur
   * @param page Numéro de page (défaut: 1)
   * @param limit Nombre de résultats par page (défaut: 10)
   * @param status Filtrer par statut (optionnel)
   * @returns Promise<PaginatedGalleriesResponse>
   */
  async getVendorGalleries(
    page: number = 1,
    limit: number = 10,
    status?: GalleryStatus
  ): Promise<PaginatedGalleriesResponse> {
    const params: any = { page, limit };
    if (status) params.status = status;

    const response = await this.api.get('/vendor/galleries', { params });
    return response.data;
  }

  /**
   * Récupérer une galerie spécifique
   * @param id ID de la galerie
   * @returns Promise<GalleryResponse>
   */
  async getGallery(id: number): Promise<GalleryResponse> {
    const response = await this.api.get(`/vendor/galleries/${id}`);
    return response.data;
  }

  /**
   * Mettre à jour une galerie
   * @param id ID de la galerie
   * @param data Données à mettre à jour
   * @returns Promise<GalleryResponse>
   */
  async updateGallery(
    id: number,
    data: UpdateGalleryDto
  ): Promise<GalleryResponse> {
    const response = await this.api.put(`/vendor/galleries/${id}`, data);
    return response.data;
  }

  /**
   * Supprimer une galerie
   * @param id ID de la galerie
   * @returns Promise<{success: boolean, message: string}>
   */
  async deleteGallery(id: number): Promise<{ success: boolean; message: string }> {
    const response = await this.api.delete(`/vendor/galleries/${id}`);
    return response.data;
  }

  /**
   * Publier ou dépublier une galerie
   * @param id ID de la galerie
   * @param isPublished true pour publier, false pour dépublier
   * @returns Promise<{success: boolean, message: string}>
   */
  async togglePublish(
    id: number,
    isPublished: boolean
  ): Promise<{ success: boolean; message: string }> {
    const response = await this.api.patch(`/vendor/galleries/${id}/publish`, {
      is_published: isPublished,
    });
    return response.data;
  }

  // ========== ENDPOINTS PUBLICS (Sans auth) ==========

  /**
   * Récupérer toutes les galeries publiées
   * @param page Numéro de page (défaut: 1)
   * @param limit Nombre de résultats par page (défaut: 12)
   * @param vendorId Filtrer par vendeur (optionnel)
   * @returns Promise<PaginatedGalleriesResponse>
   */
  async getPublicGalleries(
    page: number = 1,
    limit: number = 12,
    vendorId?: number
  ): Promise<PaginatedGalleriesResponse> {
    const params: any = { page, limit };
    if (vendorId) params.vendorId = vendorId;

    const response = await this.api.get('/public/galleries', { params });
    return response.data;
  }

  /**
   * Récupérer une galerie publiée spécifique
   * @param id ID de la galerie
   * @returns Promise<GalleryResponse>
   */
  async getPublicGallery(id: number): Promise<GalleryResponse> {
    const response = await this.api.get(`/public/galleries/${id}`);
    return response.data;
  }
}

// Export d'une instance unique
export const galleryService = new GalleryService();
export default galleryService;
```

---

## Composants React exemples

### 1. Hook personnalisé pour les galeries

```typescript
// hooks/useGalleries.ts
import { useState, useEffect } from 'react';
import { galleryService } from '@/services/galleryService';
import type { Gallery, GalleryStatus, Pagination } from '@/types/gallery';

export function useGalleries(
  page: number = 1,
  limit: number = 10,
  status?: GalleryStatus
) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        setLoading(true);
        const response = await galleryService.getVendorGalleries(page, limit, status);
        setGalleries(response.data.galleries);
        setPagination(response.data.pagination);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des galeries');
      } finally {
        setLoading(false);
      }
    };

    fetchGalleries();
  }, [page, limit, status]);

  return { galleries, pagination, loading, error };
}
```

### 2. Composant de création de galerie

```tsx
// components/CreateGalleryForm.tsx
import { useState, FormEvent } from 'react';
import { galleryService } from '@/services/galleryService';
import type { CreateGalleryDto } from '@/types/gallery';

export function CreateGalleryForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length !== 5) {
      setError('Vous devez sélectionner exactement 5 images');
      setFiles([]);
      return;
    }

    // Vérifier la taille des fichiers
    const invalidFiles = selectedFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError(`Les fichiers suivants dépassent 5MB: ${invalidFiles.map(f => f.name).join(', ')}`);
      setFiles([]);
      return;
    }

    setFiles(selectedFiles);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (files.length !== 5) {
      setError('Vous devez sélectionner exactement 5 images');
      return;
    }

    if (title.length < 3 || title.length > 100) {
      setError('Le titre doit contenir entre 3 et 100 caractères');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: CreateGalleryDto = {
        title,
        description: description || undefined,
        images: files,
        captions: captions.filter(c => c).map(caption => ({ caption })),
      };

      await galleryService.createGallery(data);

      // Réinitialiser le formulaire
      setTitle('');
      setDescription('');
      setFiles([]);
      setCaptions(['', '', '', '', '']);

      if (onSuccess) onSuccess();

      alert('Galerie créée avec succès!');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Titre de la galerie *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={100}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Ma Collection Printemps 2024"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description (optionnel)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Description de votre galerie..."
        />
        <p className="text-sm text-gray-500 mt-1">
          {description.length}/500 caractères
        </p>
      </div>

      <div>
        <label htmlFor="images" className="block text-sm font-medium">
          Images (exactement 5) *
        </label>
        <input
          id="images"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="mt-1 block w-full"
        />
        <p className="text-sm text-gray-500 mt-1">
          Formats acceptés: JPEG, PNG, WebP. Taille max: 5MB par image.
        </p>
        {files.length > 0 && (
          <p className="text-sm text-green-600 mt-1">
            ✓ {files.length} image{files.length > 1 ? 's' : ''} sélectionnée{files.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {files.length === 5 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Légendes (optionnel)</p>
          {files.map((file, index) => (
            <div key={index}>
              <label className="block text-xs text-gray-600">
                Image {index + 1}: {file.name}
              </label>
              <input
                type="text"
                value={captions[index]}
                onChange={(e) => {
                  const newCaptions = [...captions];
                  newCaptions[index] = e.target.value;
                  setCaptions(newCaptions);
                }}
                maxLength={200}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                placeholder={`Légende pour l'image ${index + 1}`}
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || files.length !== 5}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Création en cours...' : 'Créer la galerie'}
      </button>
    </form>
  );
}
```

### 3. Liste des galeries

```tsx
// components/GalleriesList.tsx
import { useState } from 'react';
import { useGalleries } from '@/hooks/useGalleries';
import { galleryService } from '@/services/galleryService';
import type { Gallery, GalleryStatus } from '@/types/gallery';

export function GalleriesList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<GalleryStatus | undefined>();
  const { galleries, pagination, loading, error } = useGalleries(page, 10, statusFilter);

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette galerie ?')) {
      return;
    }

    try {
      await galleryService.deleteGallery(id);
      alert('Galerie supprimée avec succès');
      window.location.reload(); // Recharger la liste
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    try {
      await galleryService.togglePublish(id, !currentStatus);
      alert(currentStatus ? 'Galerie dépubliée' : 'Galerie publiée');
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter(undefined)}
          className={`px-4 py-2 rounded ${!statusFilter ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Toutes
        </button>
        <button
          onClick={() => setStatusFilter(GalleryStatus.PUBLISHED)}
          className={`px-4 py-2 rounded ${statusFilter === GalleryStatus.PUBLISHED ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Publiées
        </button>
        <button
          onClick={() => setStatusFilter(GalleryStatus.DRAFT)}
          className={`px-4 py-2 rounded ${statusFilter === GalleryStatus.DRAFT ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Brouillons
        </button>
      </div>

      {/* Liste des galeries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {galleries.map((gallery) => (
          <div key={gallery.id} className="border rounded-lg p-4 shadow">
            {/* Image de couverture */}
            {gallery.images[0] && (
              <img
                src={gallery.images[0].imageUrl}
                alt={gallery.title}
                className="w-full h-48 object-cover rounded mb-3"
              />
            )}

            <h3 className="font-bold text-lg mb-2">{gallery.title}</h3>
            {gallery.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {gallery.description}
              </p>
            )}

            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-1 rounded text-xs ${
                gallery.isPublished
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {gallery.isPublished ? 'Publié' : 'Brouillon'}
              </span>
              <span className="text-sm text-gray-500">
                {gallery.images.length} images
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleTogglePublish(gallery.id, gallery.isPublished)}
                className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                {gallery.isPublished ? 'Dépublier' : 'Publier'}
              </button>
              <button
                onClick={() => handleDelete(gallery.id)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="px-4 py-2">
            Page {page} sur {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
```

### 4. Galerie publique (pour affichage côté client)

```tsx
// components/PublicGalleryGrid.tsx
import { useState, useEffect } from 'react';
import { galleryService } from '@/services/galleryService';
import type { PublicGallery } from '@/types/gallery';

export function PublicGalleryGrid() {
  const [galleries, setGalleries] = useState<PublicGallery[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        setLoading(true);
        const response = await galleryService.getPublicGalleries(page, 12);
        setGalleries(response.data.galleries as PublicGallery[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleries();
  }, [page]);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {galleries.map((gallery) => (
        <div key={gallery.id} className="group cursor-pointer">
          <div className="aspect-square relative overflow-hidden rounded-lg">
            <img
              src={gallery.images[0]?.imageUrl}
              alt={gallery.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                Voir la galerie
              </span>
            </div>
          </div>
          <h3 className="font-semibold mt-3">{gallery.title}</h3>
          <p className="text-sm text-gray-600">
            Par {gallery.vendor.shop_name || `${gallery.vendor.firstName} ${gallery.vendor.lastName}`}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

## Gestion des erreurs

### Types d'erreurs courants

```typescript
// types/errors.ts
export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
  error: string;
}

// Gestionnaire d'erreur
export function handleApiError(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'Une erreur est survenue';
}
```

### Hook pour la gestion d'erreur

```typescript
// hooks/useApiError.ts
import { useState } from 'react';
import { handleApiError } from '@/types/errors';

export function useApiError() {
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any) => {
    const message = handleApiError(err);
    setError(message);
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
}
```

---

## Bonnes pratiques

### ✅ À faire

1. **Validation côté client**
   ```typescript
   // Toujours valider avant d'envoyer
   if (files.length !== 5) {
     alert('Exactement 5 images requises');
     return;
   }
   ```

2. **Gestion du loading**
   ```typescript
   const [loading, setLoading] = useState(false);

   try {
     setLoading(true);
     await galleryService.createGallery(data);
   } finally {
     setLoading(false);
   }
   ```

3. **Feedback utilisateur**
   ```typescript
   // Toujours informer l'utilisateur
   toast.success('Galerie créée avec succès!');
   toast.error('Erreur lors de la création');
   ```

4. **Optimisation des images**
   ```typescript
   // Prévisualiser les images avant upload
   const preview = URL.createObjectURL(file);
   // Ne pas oublier de libérer la mémoire
   URL.revokeObjectURL(preview);
   ```

### ❌ À éviter

1. **Ne pas uploader sans validation**
   ```typescript
   // ❌ Mauvais
   await galleryService.createGallery({ images: files });

   // ✅ Bon
   if (files.length === 5) {
     await galleryService.createGallery({ images: files });
   }
   ```

2. **Ne pas ignorer les erreurs**
   ```typescript
   // ❌ Mauvais
   try {
     await galleryService.createGallery(data);
   } catch (err) {
     // Silence...
   }

   // ✅ Bon
   try {
     await galleryService.createGallery(data);
   } catch (err) {
     handleError(err);
   }
   ```

3. **Ne pas stocker le token en clair**
   ```typescript
   // ❌ Mauvais - localStorage non sécurisé
   localStorage.setItem('token', token);

   // ✅ Bon - httpOnly cookie ou solution sécurisée
   // Géré par le backend
   ```

---

## Checklist d'intégration

- [ ] Configurer les variables d'environnement
- [ ] Créer les types TypeScript
- [ ] Implémenter le service API
- [ ] Créer les hooks personnalisés
- [ ] Implémenter le formulaire de création
- [ ] Implémenter la liste des galeries
- [ ] Ajouter la pagination
- [ ] Gérer les erreurs
- [ ] Ajouter le loading/feedback
- [ ] Tester tous les endpoints
- [ ] Optimiser les performances
- [ ] Ajouter la documentation

---

## Support

Pour toute question ou problème:
1. Consultez le [README.md](./README.md) pour la documentation complète
2. Consultez les [EXAMPLES.md](./EXAMPLES.md) pour des exemples de requêtes
3. Vérifiez la documentation Swagger: `http://localhost:3000/api`

---

**Auteur**: PrintAlma Dev Team
**Date**: 2024-12-07
**Version**: 1.0.0
