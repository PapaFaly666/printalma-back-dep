# Documentation API - Gestion des Status de Galerie pour le Frontend

## Endpoints disponibles pour gérer le status des galeries

### 1. Mettre à jour le statut d'une galerie (complet)

**Endpoint :** `PUT /vendor/galleries/:id`

**Headers requis :**
- `Authorization: Bearer <token_jwt>`
- `Content-Type: application/json`

**Corps de la requête :**
```json
{
  "title": "Titre de la galerie (optionnel)",
  "description": "Description de la galerie (optionnel)",
  "status": "PUBLISHED", // ou "DRAFT"
  "is_published": true // ou false
}
```

**Exemple de requête pour changer uniquement le statut :**
```javascript
const updateGalleryStatus = async (galleryId, newStatus) => {
  try {
    const response = await fetch(`/vendor/galleries/${galleryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus // 'PUBLISHED' ou 'DRAFT'
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### 2. Publier/Dépublier une galerie (endpoint spécialisé)

**Endpoint :** `PATCH /vendor/galleries/:id/publish`

**Headers requis :**
- `Authorization: Bearer <token_jwt>`
- `Content-Type: application/json`

**Corps de la requête :**
```json
{
  "is_published": true // pour publier
}
```

```json
{
  "is_published": false // pour dépublier
}
```

**Exemple de requête :**
```javascript
const toggleGalleryPublish = async (galleryId, isPublished) => {
  try {
    const response = await fetch(`/vendor/galleries/${galleryId}/publish`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        is_published: isPublished
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

## Status disponibles

- `DRAFT`: Brouillon (galerie non publiée)
- `PUBLISHED`: Publié (galerie visible publiquement)
- `ARCHIVED`: Archivé (galerie masquée)

## Réponses de l'API

### Succès (200 OK)
```json
{
  "success": true,
  "message": "Galerie mise à jour avec succès",
  "data": {
    "id": 1,
    "title": "Ma galerie",
    "description": "Description de la galerie",
    "status": "PUBLISHED",
    "isPublished": true,
    "vendorId": 123,
    "createdAt": "2025-12-08T10:00:00Z",
    "updatedAt": "2025-12-08T11:00:00Z",
    "images": [...]
  }
}
```

### Erreurs possibles

**Galerie non trouvée (404) :**
```json
{
  "statusCode": 404,
  "message": "Galerie non trouvée"
}
```

**Validation échouée (400) - Pour publication :**
```json
{
  "statusCode": 400,
  "message": "Une galerie doit avoir exactement 5 images pour être publiée"
}
```

## Fonction utilitaire React

```jsx
import React, { useState } from 'react';

const GalleryStatusManager = ({ gallery, token, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`/vendor/galleries/${gallery.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          is_published: newStatus === 'PUBLISHED'
        })
      });

      const result = await response.json();

      if (result.success) {
        onStatusUpdate && onStatusUpdate(result.data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gallery-status-manager">
      <span>Status actuel: {gallery.status}</span>

      <button
        onClick={() => handleStatusChange('DRAFT')}
        disabled={loading || gallery.status === 'DRAFT'}
      >
        {loading ? 'Chargement...' : 'Brouillon'}
      </button>

      <button
        onClick={() => handleStatusChange('PUBLISHED')}
        disabled={loading || gallery.status === 'PUBLISHED'}
      >
        {loading ? 'Chargement...' : 'Publier'}
      </button>
    </div>
  );
};

export default GalleryStatusManager;
```

## Points importants

1. **Authentification requise** : Toutes les requêtes nécessitent un token JWT valide
2. **Vérification automatique** : Le système vérifie que la galerie a exactement 5 images avant publication
3. **Double status** : Le champ `status` et `is_published` sont synchronisés automatiquement
4. **Sécurité** : Seul le propriétaire de la galerie peut modifier son statut