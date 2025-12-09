# API Documentation - Création de Galerie Vendor

## Endpoint

```
POST /vendor/galleries
```

## Authentification

L'endpoint nécessite une authentification via cookie. Le cookie `auth_token` est automatiquement ajouté lors de la connexion.

## Requête

### Format
- **Content-Type**: `multipart/form-data`
- **Méthode**: POST

### Champs

#### Champs de formulaire (form-data)
| Nom | Type | Requis | Description |
|-----|------|---------|-------------|
| `title` | string | Oui | Titre de la galerie (3-100 caractères) |
| `description` | string | Non | Description de la galerie (max 500 caractères) |
| `captions` | string (JSON) | Non | Légendes pour chaque image |
| `images` | File[] | Oui | **Exactement 5 images** |

#### Images
- **Nom du champ**: `images` (tableau de fichiers)
- **Nombre requis**: **Exactement 5 fichiers**
- **Formats acceptés**: jpg, jpeg, png, gif, webp
- **Taille max par fichier**: 10MB
- **Types MIME**: `image/*`

## Réponse

### Succès (201 Created)
```json
{
  "success": true,
  "message": "Galerie créée avec succès",
  "data": {
    "id": 1,
    "vendorId": 2,
    "title": "Ma Galerie",
    "description": "Description de ma galerie",
    "status": "DRAFT",
    "isPublished": false,
    "createdAt": "2025-12-07T23:31:52.371Z",
    "updatedAt": "2025-12-07T23:31:52.371Z",
    "deletedAt": null,
    "images": [
      {
        "id": 1,
        "galleryId": 1,
        "imageUrl": "https://res.cloudinary.com/...",
        "imagePath": "https://res.cloudinary.com/...",
        "publicId": "galleries/vendor_2/...",
        "caption": null,
        "orderPosition": 1,
        "fileSize": 2048576,
        "mimeType": "image/jpeg",
        "width": 1920,
        "height": 1080,
        "createdAt": "2025-12-07T23:31:53.933Z"
      }
      // ... 4 autres images
    ]
  }
}
```

### Erreurs

#### 400 Bad Request
```json
{
  "message": "Une galerie doit contenir exactement 5 images",
  "error": "Bad Request",
  "statusCode": 400
}
```

#### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

## Exemples de code

### JavaScript (Fetch API)

```javascript
async function createGallery(title, description, imageFiles) {
  // Vérifier qu'on a exactement 5 images
  if (imageFiles.length !== 5) {
    throw new Error('Vous devez sélectionner exactement 5 images');
  }

  const formData = new FormData();
  formData.append('title', title);
  if (description) {
    formData.append('description', description);
  }

  // Ajouter les 5 images
  imageFiles.forEach((file, index) => {
    formData.append('images', file);
  });

  try {
    const response = await fetch('/vendor/galleries', {
      method: 'POST',
      body: formData,
      // Ne pas mettre le Content-Type, il sera ajouté automatiquement avec le boundary
      credentials: 'include' // Important pour envoyer les cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Utilisation
const handleCreateGallery = async () => {
  try {
    const files = document.getElementById('imageInput').files;
    const gallery = await createGallery(
      'Ma nouvelle galerie',
      'Description de ma galerie',
      Array.from(files)
    );
    console.log('Galerie créée:', gallery);
  } catch (error) {
    alert(error.message);
  }
};
```

### React Hook

```javascript
import { useState } from 'react';

const useCreateGallery = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createGallery = async (title, description, imageFiles) => {
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!title || title.length < 3) {
        throw new Error('Le titre doit contenir au moins 3 caractères');
      }

      if (imageFiles.length !== 5) {
        throw new Error('Vous devez sélectionner exactement 5 images');
      }

      const formData = new FormData();
      formData.append('title', title);

      if (description) {
        formData.append('description', description);
      }

      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/vendor/galleries', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création');
      }

      setLoading(false);
      return data.data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { createGallery, loading, error };
};

// Composant React
const GalleryCreateForm = () => {
  const { createGallery, loading, error } = useCreateGallery();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length !== 5) {
      alert('Veuillez sélectionner exactement 5 images');
      return;
    }

    setImages(files);

    // Créer des aperçus
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const gallery = await createGallery(title, description, images);
      alert('Galerie créée avec succès!');
      // Rediriger ou mise à jour de l'UI
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Titre*</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={100}
        />
      </div>

      <div>
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
        />
      </div>

      <div>
        <label>Images (5 requises)*</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          required
        />
        {previews.map((preview, index) => (
          <img key={index} src={preview} alt={`Preview ${index + 1}`} />
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Création...' : 'Créer la galerie'}
      </button>
    </form>
  );
};
```

### Axios

```javascript
import axios from 'axios';

const createGallery = async (title, description, imageFiles) => {
  if (imageFiles.length !== 5) {
    throw new Error('Vous devez sélectionner exactement 5 images');
  }

  const formData = new FormData();
  formData.append('title', title);
  if (description) {
    formData.append('description', description);
  }

  imageFiles.forEach((file) => {
    formData.append('images', file);
  });

  try {
    const response = await axios.post('/vendor/galleries', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true // Pour envoyer les cookies
    });

    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la création');
  }
};
```

## Notes importantes

1. **Exactement 5 images** sont requises - ni plus, ni moins
2. L'authentification se fait via cookie, pas via header Authorization
3. Ne pas spécifier manuellement le `Content-Type` lors de l'envoi de FormData
4. Les images sont automatiquement uploadées sur Cloudinary
5. La galerie est créée avec le statut `DRAFT` par défaut
6. Pour publier une galerie, utiliser l'endpoint `PATCH /vendor/galleries/:id/publish`

## Validation côté client recommandée

```javascript
const validateImages = (files) => {
  if (files.length !== 5) {
    return 'Vous devez sélectionner exactement 5 images';
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  for (const file of files) {
    if (!validTypes.includes(file.type)) {
      return `Le fichier ${file.name} n'est pas une image valide`;
    }
    if (file.size > maxSize) {
      return `Le fichier ${file.name} est trop grand (max 10MB)`;
    }
  }

  return null;
};
```