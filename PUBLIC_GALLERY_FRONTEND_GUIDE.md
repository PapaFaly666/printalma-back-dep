# Documentation API - Galeries Publiques pour le Frontend

## Endpoint principal

**URL de base :** `http://localhost:3004/public/galleries`

## 1. Lister les galeries publiées

**Endpoint :** `GET /public/galleries`

**Paramètres de requête :**
- `page` (optionnel, numérique) : Numéro de la page (défaut: 1)
- `limit` (optionnel, numérique) : Nombre d'éléments par page (défaut: 12)
- `vendorId` (optionnel, numérique) : ID du vendeur pour filtrer ses galeries

**Headers requis :**
- `Content-Type: application/json`

**Exemples de requêtes :**

### Récupérer toutes les galeries publiées (page 1, 12 par défaut)
```javascript
const getAllGalleries = async () => {
  try {
    const response = await fetch('http://localhost:3004/public/galleries', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Récupérer les galeries avec pagination
```javascript
const getGalleriesWithPagination = async (page = 1, limit = 12) => {
  try {
    const response = await fetch(
      `http://localhost:3004/public/galleries?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Récupérer les galeries d'un vendeur spécifique
```javascript
const getVendorGalleries = async (vendorId) => {
  try {
    const response = await fetch(
      `http://localhost:3004/public/galleries?vendorId=${vendorId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Combiner tous les paramètres
```javascript
const getGalleriesWithFilters = async (page, limit, vendorId) => {
  try {
    const params = new URLSearchParams({
      page: page || 1,
      limit: limit || 12,
    });

    if (vendorId) {
      params.append('vendorId', vendorId);
    }

    const response = await fetch(
      `http://localhost:3004/public/galleries?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

## 2. Récupérer une galerie spécifique

**Endpoint :** `GET /public/galleries/:id`

**Exemple de requête :**
```javascript
const getGalleryById = async (galleryId) => {
  try {
    const response = await fetch(
      `http://localhost:3004/public/galleries/${galleryId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

## Structure des données retournées

### Réponse pour la liste de galeries
```json
{
  "success": true,
  "data": {
    "galleries": [
      {
        "id": 2,
        "vendorId": 2,
        "title": "cds",
        "description": null,
        "status": "PUBLISHED",
        "isPublished": true,
        "createdAt": "2025-12-07T23:56:30.009Z",
        "updatedAt": "2025-12-08T09:18:07.421Z",
        "deletedAt": null,
        "images": [
          {
            "id": 9,
            "galleryId": 2,
            "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1765151794/galleries/vendor_2/1765151790747-corrompu_with_bgc.jpg",
            "imagePath": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1765151794/galleries/vendor_2/1765151790747-corrompu_with_bgc.jpg",
            "publicId": "galleries/vendor_2/1765151790747-corrompu_with_bgc",
            "caption": "Image 1",
            "orderPosition": 1,
            "fileSize": 133084,
            "mimeType": "image/jpeg",
            "width": 1080,
            "height": 1080,
            "createdAt": "2025-12-07T23:56:34.856Z"
          },
          // ... jusqu'à 5 images maximum
        ],
        "vendor": {
          "id": 2,
          "firstName": "Papa Faly",
          "lastName": "DIAGNE",
          "shop_name": "CARRE",
          "avatar": null
        }
      }
      // ... autres galeries
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

### Réponse pour une galerie individuelle
```json
{
  "success": true,
  "data": {
    "id": 2,
    "vendorId": 2,
    "title": "cds",
    "description": null,
    "status": "PUBLISHED",
    "isPublished": true,
    "createdAt": "2025-12-07T23:56:30.009Z",
    "updatedAt": "2025-12-08T09:18:07.421Z",
    "deletedAt": null,
    "images": [...],
    "vendor": {
      "id": 2,
      "firstName": "Papa Faly",
      "lastName": "DIAGNE",
      "shop_name": "CARRE",
      "avatar": null
    }
  }
}
```

## Composant React d'exemple

```jsx
import React, { useState, useEffect } from 'react';

const PublicGalleries = () => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchGalleries = async (page = 1, limit = 12, vendorId = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit,
      });

      if (vendorId) {
        params.append('vendorId', vendorId);
      }

      const response = await fetch(
        `http://localhost:3004/public/galleries?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setGalleries(result.data.galleries);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleries(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="galleries-container">
      <h1>Galerie Publique</h1>

      <div className="galleries-grid">
        {galleries.map((gallery) => (
          <div key={gallery.id} className="gallery-card">
            <h3>{gallery.title}</h3>

            {gallery.description && (
              <p className="gallery-description">{gallery.description}</p>
            )}

            <div className="gallery-images">
              {gallery.images.slice(0, 3).map((image) => (
                <img
                  key={image.id}
                  src={image.imageUrl}
                  alt={image.caption || `Image ${image.orderPosition}`}
                  className="gallery-thumbnail"
                />
              ))}
              {gallery.images.length > 3 && (
                <div className="more-images">
                  +{gallery.images.length - 3} images
                </div>
              )}
            </div>

            <div className="gallery-vendor">
              <p>Par {gallery.vendor.firstName} {gallery.vendor.lastName}</p>
              <span className="shop-name">{gallery.vendor.shop_name}</span>
            </div>

            <div className="gallery-date">
              Créé le {new Date(gallery.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Précédent
          </button>

          <span>
            Page {currentPage} sur {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default PublicGalleries;
```

## Points importants

1. **Pas d'authentification requise** : Les galeries publiques sont accessibles sans token
2. **Validation automatique** : Seules les galeries avec `status: "PUBLISHED"` et `isPublished: true` sont retournées
3. **Images limitées** : Chaque galerie contient exactement 5 images maximum
4. **Informations vendeur incluses** : Chaque galerie inclut les informations de base du vendeur
5. **Pagination disponible** : Les résultats sont paginés pour optimiser les performances