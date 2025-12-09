# Exemples de Requêtes API - Système de Galerie Vendeur

Ce fichier contient des exemples concrets de requêtes pour tester le système de galerie vendeur.

---

## Configuration initiale

### Variables d'environnement
```bash
API_URL=http://localhost:3000
VENDOR_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Token JWT du vendeur
```

---

## 1. Créer une galerie (avec cURL)

```bash
curl -X POST http://localhost:3000/vendor/galleries \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -F "title=Ma Collection Printemps 2024" \
  -F "description=Collection inspirée par les couleurs du printemps" \
  -F "captions=[{\"caption\":\"Design floral\"},{\"caption\":\"Motif abstrait\"},{\"caption\":\"Style minimaliste\"},{\"caption\":\"Couleurs vives\"},{\"caption\":\"Géométrie moderne\"}]" \
  -F "images=@./image1.jpg" \
  -F "images=@./image2.jpg" \
  -F "images=@./image3.jpg" \
  -F "images=@./image4.jpg" \
  -F "images=@./image5.jpg"
```

---

## 2. Créer une galerie (avec Postman)

**Method:** POST
**URL:** `http://localhost:3000/vendor/galleries`
**Headers:**
```
Authorization: Bearer {VENDOR_TOKEN}
```

**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| title | Text | Ma Collection Printemps 2024 |
| description | Text | Collection inspirée par les couleurs du printemps |
| captions | Text | [{"caption":"Design floral"},{"caption":"Motif abstrait"},{"caption":"Style minimaliste"},{"caption":"Couleurs vives"},{"caption":"Géométrie moderne"}] |
| images | File | image1.jpg |
| images | File | image2.jpg |
| images | File | image3.jpg |
| images | File | image4.jpg |
| images | File | image5.jpg |

---

## 3. Créer une galerie (avec JavaScript/TypeScript)

```typescript
async function createGallery(token: string, files: File[]) {
  const formData = new FormData();

  // Ajouter les métadonnées
  formData.append('title', 'Ma Collection Printemps 2024');
  formData.append('description', 'Collection inspirée par les couleurs du printemps');

  // Ajouter les images
  files.forEach((file) => {
    formData.append('images', file);
  });

  // Ajouter les légendes (optionnel)
  const captions = [
    { caption: 'Design floral' },
    { caption: 'Motif abstrait' },
    { caption: 'Style minimaliste' },
    { caption: 'Couleurs vives' },
    { caption: 'Géométrie moderne' }
  ];
  formData.append('captions', JSON.stringify(captions));

  const response = await fetch('http://localhost:3000/vendor/galleries', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return response.json();
}
```

---

## 4. Récupérer toutes les galeries du vendeur

```bash
curl -X GET "http://localhost:3000/vendor/galleries?page=1&limit=10" \
  -H "Authorization: Bearer $VENDOR_TOKEN"
```

```typescript
async function getVendorGalleries(token: string, page = 1, limit = 10) {
  const response = await fetch(
    `http://localhost:3000/vendor/galleries?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
}
```

---

## 5. Récupérer les galeries publiées (filtré par statut)

```bash
curl -X GET "http://localhost:3000/vendor/galleries?status=PUBLISHED" \
  -H "Authorization: Bearer $VENDOR_TOKEN"
```

---

## 6. Récupérer une galerie spécifique

```bash
curl -X GET "http://localhost:3000/vendor/galleries/1" \
  -H "Authorization: Bearer $VENDOR_TOKEN"
```

```typescript
async function getGallery(token: string, galleryId: number) {
  const response = await fetch(
    `http://localhost:3000/vendor/galleries/${galleryId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
}
```

---

## 7. Mettre à jour une galerie

```bash
curl -X PUT "http://localhost:3000/vendor/galleries/1" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nouveau titre de galerie",
    "description": "Nouvelle description mise à jour",
    "status": "PUBLISHED"
  }'
```

```typescript
async function updateGallery(
  token: string,
  galleryId: number,
  data: {
    title?: string;
    description?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  }
) {
  const response = await fetch(
    `http://localhost:3000/vendor/galleries/${galleryId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  );

  return response.json();
}
```

---

## 8. Publier une galerie

```bash
curl -X PATCH "http://localhost:3000/vendor/galleries/1/publish" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_published": true
  }'
```

```typescript
async function publishGallery(token: string, galleryId: number) {
  const response = await fetch(
    `http://localhost:3000/vendor/galleries/${galleryId}/publish`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_published: true })
    }
  );

  return response.json();
}
```

---

## 9. Dépublier une galerie

```bash
curl -X PATCH "http://localhost:3000/vendor/galleries/1/publish" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_published": false
  }'
```

---

## 10. Supprimer une galerie

```bash
curl -X DELETE "http://localhost:3000/vendor/galleries/1" \
  -H "Authorization: Bearer $VENDOR_TOKEN"
```

```typescript
async function deleteGallery(token: string, galleryId: number) {
  const response = await fetch(
    `http://localhost:3000/vendor/galleries/${galleryId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
}
```

---

## 11. Récupérer les galeries publiées (Public - sans auth)

```bash
curl -X GET "http://localhost:3000/public/galleries?page=1&limit=12"
```

```typescript
async function getPublicGalleries(page = 1, limit = 12, vendorId?: number) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(vendorId && { vendorId: vendorId.toString() })
  });

  const response = await fetch(
    `http://localhost:3000/public/galleries?${params}`
  );

  return response.json();
}
```

---

## 12. Récupérer une galerie publique spécifique (Public - sans auth)

```bash
curl -X GET "http://localhost:3000/public/galleries/1"
```

---

## Exemples de Réponses

### Succès - Création de galerie
```json
{
  "success": true,
  "message": "Galerie créée avec succès",
  "data": {
    "id": 1,
    "vendorId": 5,
    "title": "Ma Collection Printemps 2024",
    "description": "Collection inspirée par les couleurs du printemps",
    "status": "DRAFT",
    "isPublished": false,
    "createdAt": "2024-12-07T10:00:00.000Z",
    "updatedAt": "2024-12-07T10:00:00.000Z",
    "deletedAt": null,
    "images": [
      {
        "id": 1,
        "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/galleries/vendor_5/gallery-1701945678901.webp",
        "publicId": "galleries/vendor_5/gallery-1701945678901",
        "caption": "Design floral",
        "orderPosition": 1,
        "fileSize": 245678,
        "mimeType": "image/webp",
        "width": 1200,
        "height": 800,
        "createdAt": "2024-12-07T10:00:00.000Z"
      },
      // ... 4 autres images
    ]
  }
}
```

### Erreur - Nombre d'images incorrect
```json
{
  "success": false,
  "message": "Une galerie doit contenir exactement 5 images",
  "statusCode": 400,
  "error": "Bad Request"
}
```

### Erreur - Format d'image non supporté
```json
{
  "success": false,
  "message": "Le fichier image6.bmp a un format non supporté. Formats acceptés: JPEG, PNG, WebP",
  "statusCode": 400,
  "error": "Bad Request"
}
```

### Erreur - Fichier trop volumineux
```json
{
  "success": false,
  "message": "Le fichier large-image.jpg dépasse la taille maximale de 5MB",
  "statusCode": 400,
  "error": "Bad Request"
}
```

### Erreur - Galerie non trouvée
```json
{
  "success": false,
  "message": "Galerie non trouvée",
  "statusCode": 404,
  "error": "Not Found"
}
```

### Erreur - Tentative de publication sans 5 images
```json
{
  "success": false,
  "message": "Une galerie doit avoir exactement 5 images pour être publiée",
  "statusCode": 400,
  "error": "Bad Request"
}
```

---

## Tests avec React/Next.js

### Composant de création de galerie
```tsx
import { useState } from 'react';

export function CreateGalleryForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>(['', '', '', '', '']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length !== 5) {
      alert('Vous devez sélectionner exactement 5 images');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);

    files.forEach((file) => {
      formData.append('images', file);
    });

    const captionsData = captions.map((caption) => ({ caption }));
    formData.append('captions', JSON.stringify(captionsData));

    try {
      const response = await fetch('/api/vendor/galleries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        alert('Galerie créée avec succès!');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la galerie');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Titre de la galerie"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={3}
        maxLength={100}
      />

      <textarea
        placeholder="Description (optionnel)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
      />

      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={(e) => {
          const selectedFiles = Array.from(e.target.files || []);
          if (selectedFiles.length === 5) {
            setFiles(selectedFiles);
          } else {
            alert('Veuillez sélectionner exactement 5 images');
          }
        }}
      />

      {files.length === 5 && (
        <div>
          {files.map((file, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Légende image ${index + 1} (optionnel)`}
              value={captions[index]}
              onChange={(e) => {
                const newCaptions = [...captions];
                newCaptions[index] = e.target.value;
                setCaptions(newCaptions);
              }}
              maxLength={200}
            />
          ))}
        </div>
      )}

      <button type="submit" disabled={files.length !== 5}>
        Créer la galerie
      </button>
    </form>
  );
}
```

---

## Collection Postman

Vous pouvez importer cette collection dans Postman pour tester facilement toutes les routes:

```json
{
  "info": {
    "name": "Vendor Gallery API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "vendorToken",
      "value": "YOUR_VENDOR_TOKEN_HERE"
    }
  ],
  "item": [
    {
      "name": "Create Gallery",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{vendorToken}}"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "title",
              "value": "Ma Collection Printemps 2024",
              "type": "text"
            },
            {
              "key": "description",
              "value": "Collection inspirée par les couleurs du printemps",
              "type": "text"
            },
            {
              "key": "images",
              "type": "file",
              "src": []
            }
          ]
        },
        "url": {
          "raw": "{{baseUrl}}/vendor/galleries",
          "host": ["{{baseUrl}}"],
          "path": ["vendor", "galleries"]
        }
      }
    }
  ]
}
```

---

**Auteur**: PrintAlma Dev Team
**Date**: 2024-12-07
