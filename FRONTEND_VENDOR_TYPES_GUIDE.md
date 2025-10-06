# Guide Frontend - Gestion des Types de Vendeurs

## Vue d'ensemble

Ce guide vous aide à intégrer l'API de gestion des types de vendeurs dans votre frontend. Le système permet aux administrateurs de créer, modifier et supprimer dynamiquement des types de vendeurs, et aux utilisateurs de consulter ces types.

---

## Base URL

```
http://localhost:3004/api/vendor-types
```

---

## Authentification

Tous les endpoints nécessitent un token JWT dans le header :

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

---

## Endpoints

### 1. 📋 Récupérer tous les types de vendeurs

**Méthode :** `GET`
**URL :** `/api/vendor-types`
**Autorisation :** Tous les utilisateurs authentifiés

#### Request

```javascript
const response = await fetch('http://localhost:3004/api/vendor-types', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const vendorTypes = await response.json();
```

#### Response Success (200)

```json
[
  {
    "id": 1,
    "label": "Photographe",
    "description": "Spécialiste de la photographie professionnelle",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "userCount": 5
  },
  {
    "id": 2,
    "label": "Designer",
    "description": "Création de designs personnalisés",
    "createdAt": "2024-01-16T14:20:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z",
    "userCount": 12
  },
  {
    "id": 3,
    "label": "Streamer",
    "description": "Créateur de contenu en direct",
    "createdAt": "2024-01-17T09:15:00.000Z",
    "updatedAt": "2024-01-17T09:15:00.000Z",
    "userCount": 3
  }
]
```

#### Exemple React avec Axios

```typescript
import axios from 'axios';

interface VendorType {
  id: number;
  label: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
}

const fetchVendorTypes = async (): Promise<VendorType[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get<VendorType[]>(
      'http://localhost:3004/api/vendor-types',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des types:', error);
    throw error;
  }
};
```

---

### 2. 🔍 Récupérer un type de vendeur par ID

**Méthode :** `GET`
**URL :** `/api/vendor-types/:id`
**Autorisation :** Tous les utilisateurs authentifiés

#### Request

```javascript
const response = await fetch('http://localhost:3004/api/vendor-types/1', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const vendorType = await response.json();
```

#### Response Success (200)

```json
{
  "id": 1,
  "label": "Photographe",
  "description": "Spécialiste de la photographie professionnelle",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "userCount": 5
}
```

#### Response Error (404)

```json
{
  "statusCode": 404,
  "message": "Type de vendeur #999 introuvable",
  "error": "Not Found"
}
```

#### Exemple React avec Axios

```typescript
const fetchVendorTypeById = async (id: number): Promise<VendorType> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get<VendorType>(
      `http://localhost:3004/api/vendor-types/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.error('Type de vendeur introuvable');
    }
    throw error;
  }
};
```

---

### 3. ➕ Créer un nouveau type de vendeur

**Méthode :** `POST`
**URL :** `/api/vendor-types`
**Autorisation :** ADMIN ou SUPERADMIN uniquement

#### Request Body

```json
{
  "label": "Photographe",
  "description": "Spécialiste de la photographie professionnelle"
}
```

**Validations :**
- `label` : Obligatoire, 2-50 caractères, unique
- `description` : Obligatoire, 5-200 caractères

#### Request

```javascript
const newVendorType = {
  label: "Photographe",
  description: "Spécialiste de la photographie professionnelle"
};

const response = await fetch('http://localhost:3004/api/vendor-types', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newVendorType)
});

const result = await response.json();
```

#### Response Success (201)

```json
{
  "message": "Type de vendeur créé avec succès",
  "vendorType": {
    "id": 1,
    "label": "Photographe",
    "description": "Spécialiste de la photographie professionnelle",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Response Error (409) - Type déjà existant

```json
{
  "statusCode": 409,
  "message": "Le type de vendeur \"Photographe\" existe déjà",
  "error": "Conflict"
}
```

#### Response Error (400) - Validation échouée

```json
{
  "statusCode": 400,
  "message": [
    "label must be longer than or equal to 2 characters",
    "description must be longer than or equal to 5 characters"
  ],
  "error": "Bad Request"
}
```

#### Exemple React avec Axios

```typescript
interface CreateVendorTypeDto {
  label: string;
  description: string;
}

interface CreateVendorTypeResponse {
  message: string;
  vendorType: VendorType;
}

const createVendorType = async (
  data: CreateVendorTypeDto
): Promise<CreateVendorTypeResponse> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post<CreateVendorTypeResponse>(
      'http://localhost:3004/api/vendor-types',
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409) {
        throw new Error('Ce type de vendeur existe déjà');
      }
      if (error.response?.status === 400) {
        throw new Error('Données invalides');
      }
    }
    throw error;
  }
};
```

---

### 4. ✏️ Modifier un type de vendeur

**Méthode :** `PATCH`
**URL :** `/api/vendor-types/:id`
**Autorisation :** ADMIN ou SUPERADMIN uniquement

#### Request Body

Tous les champs sont optionnels (modification partielle) :

```json
{
  "label": "Photographe Pro",
  "description": "Photographe professionnel certifié"
}
```

**Ou modification d'un seul champ :**

```json
{
  "description": "Nouvelle description"
}
```

#### Request

```javascript
const updates = {
  label: "Photographe Pro",
  description: "Photographe professionnel certifié"
};

const response = await fetch('http://localhost:3004/api/vendor-types/1', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updates)
});

const result = await response.json();
```

#### Response Success (200)

```json
{
  "message": "Type de vendeur modifié avec succès",
  "vendorType": {
    "id": 1,
    "label": "Photographe Pro",
    "description": "Photographe professionnel certifié",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Response Error (404)

```json
{
  "statusCode": 404,
  "message": "Type de vendeur #999 introuvable",
  "error": "Not Found"
}
```

#### Response Error (409) - Nouveau label déjà utilisé

```json
{
  "statusCode": 409,
  "message": "Le type de vendeur \"Designer\" existe déjà",
  "error": "Conflict"
}
```

#### Exemple React avec Axios

```typescript
interface UpdateVendorTypeDto {
  label?: string;
  description?: string;
}

interface UpdateVendorTypeResponse {
  message: string;
  vendorType: VendorType;
}

const updateVendorType = async (
  id: number,
  data: UpdateVendorTypeDto
): Promise<UpdateVendorTypeResponse> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.patch<UpdateVendorTypeResponse>(
      `http://localhost:3004/api/vendor-types/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('Type de vendeur introuvable');
      }
      if (error.response?.status === 409) {
        throw new Error('Ce nom de type existe déjà');
      }
    }
    throw error;
  }
};
```

---

### 5. 🗑️ Supprimer un type de vendeur

**Méthode :** `DELETE`
**URL :** `/api/vendor-types/:id`
**Autorisation :** ADMIN ou SUPERADMIN uniquement

⚠️ **Important :** Impossible de supprimer un type utilisé par des vendeurs

#### Request

```javascript
const response = await fetch('http://localhost:3004/api/vendor-types/1', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
```

#### Response Success (200)

```json
{
  "message": "Type de vendeur supprimé avec succès"
}
```

#### Response Error (404)

```json
{
  "statusCode": 404,
  "message": "Type de vendeur #999 introuvable",
  "error": "Not Found"
}
```

#### Response Error (400) - Type utilisé par des vendeurs

```json
{
  "statusCode": 400,
  "message": "Impossible de supprimer ce type car 5 vendeur(s) l'utilisent actuellement",
  "error": "Bad Request"
}
```

#### Exemple React avec Axios

```typescript
interface DeleteVendorTypeResponse {
  message: string;
}

const deleteVendorType = async (id: number): Promise<DeleteVendorTypeResponse> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete<DeleteVendorTypeResponse>(
      `http://localhost:3004/api/vendor-types/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('Type de vendeur introuvable');
      }
      if (error.response?.status === 400) {
        const message = error.response.data.message;
        throw new Error(message);
      }
    }
    throw error;
  }
};
```

---

## Exemples d'intégration complète

### Hook React personnalisé

```typescript
// hooks/useVendorTypes.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3004/api/vendor-types';

export const useVendorTypes = () => {
  const [vendorTypes, setVendorTypes] = useState<VendorType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('token');

  const fetchVendorTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<VendorType[]>(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendorTypes(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des types');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createVendorType = async (data: CreateVendorTypeDto) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post<CreateVendorTypeResponse>(
        API_URL,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      await fetchVendorTypes(); // Recharger la liste
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Erreur lors de la création';
        setError(message);
        throw new Error(message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateVendorType = async (id: number, data: UpdateVendorTypeDto) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.patch<UpdateVendorTypeResponse>(
        `${API_URL}/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      await fetchVendorTypes(); // Recharger la liste
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Erreur lors de la modification';
        setError(message);
        throw new Error(message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteVendorType = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.delete<DeleteVendorTypeResponse>(
        `${API_URL}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      await fetchVendorTypes(); // Recharger la liste
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Erreur lors de la suppression';
        setError(message);
        throw new Error(message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorTypes();
  }, []);

  return {
    vendorTypes,
    loading,
    error,
    fetchVendorTypes,
    createVendorType,
    updateVendorType,
    deleteVendorType
  };
};
```

### Composant React - Liste des types

```typescript
// components/VendorTypesList.tsx
import React from 'react';
import { useVendorTypes } from '../hooks/useVendorTypes';

export const VendorTypesList: React.FC = () => {
  const { vendorTypes, loading, error, deleteVendorType } = useVendorTypes();

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce type ?')) {
      try {
        await deleteVendorType(id);
        alert('Type supprimé avec succès');
      } catch (err) {
        alert('Erreur : ' + (err as Error).message);
      }
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="vendor-types-list">
      <h2>Types de vendeurs</h2>
      <table>
        <thead>
          <tr>
            <th>Label</th>
            <th>Description</th>
            <th>Vendeurs</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendorTypes.map((type) => (
            <tr key={type.id}>
              <td>{type.label}</td>
              <td>{type.description}</td>
              <td>{type.userCount}</td>
              <td>
                <button onClick={() => handleEdit(type.id)}>Modifier</button>
                <button onClick={() => handleDelete(type.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### Composant React - Formulaire de création

```typescript
// components/CreateVendorTypeForm.tsx
import React, { useState } from 'react';
import { useVendorTypes } from '../hooks/useVendorTypes';

export const CreateVendorTypeForm: React.FC = () => {
  const { createVendorType, loading } = useVendorTypes();
  const [formData, setFormData] = useState({
    label: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVendorType(formData);
      alert('Type créé avec succès');
      setFormData({ label: '', description: '' });
    } catch (err) {
      alert('Erreur : ' + (err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Créer un nouveau type de vendeur</h2>

      <div className="form-group">
        <label htmlFor="label">Label (2-50 caractères) *</label>
        <input
          id="label"
          type="text"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          minLength={2}
          maxLength={50}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description (5-200 caractères) *</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          minLength={5}
          maxLength={200}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Création...' : 'Créer le type'}
      </button>
    </form>
  );
};
```

### Service API centralisé

```typescript
// services/vendorTypeService.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const vendorTypeService = {
  // Récupérer tous les types
  getAll: async (): Promise<VendorType[]> => {
    const response = await axios.get(`${API_BASE_URL}/vendor-types`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Récupérer un type par ID
  getById: async (id: number): Promise<VendorType> => {
    const response = await axios.get(`${API_BASE_URL}/vendor-types/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Créer un nouveau type
  create: async (data: CreateVendorTypeDto): Promise<CreateVendorTypeResponse> => {
    const response = await axios.post(
      `${API_BASE_URL}/vendor-types`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Modifier un type
  update: async (
    id: number,
    data: UpdateVendorTypeDto
  ): Promise<UpdateVendorTypeResponse> => {
    const response = await axios.patch(
      `${API_BASE_URL}/vendor-types/${id}`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Supprimer un type
  delete: async (id: number): Promise<DeleteVendorTypeResponse> => {
    const response = await axios.delete(
      `${API_BASE_URL}/vendor-types/${id}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  }
};
```

---

## Types TypeScript

```typescript
// types/vendorType.ts

export interface VendorType {
  id: number;
  label: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
}

export interface CreateVendorTypeDto {
  label: string;
  description: string;
}

export interface UpdateVendorTypeDto {
  label?: string;
  description?: string;
}

export interface CreateVendorTypeResponse {
  message: string;
  vendorType: VendorType;
}

export interface UpdateVendorTypeResponse {
  message: string;
  vendorType: VendorType;
}

export interface DeleteVendorTypeResponse {
  message: string;
}
```

---

## Gestion des erreurs

### Codes d'erreur possibles

| Code | Signification | Action recommandée |
|------|--------------|-------------------|
| 400 | Données invalides | Vérifier les champs du formulaire |
| 401 | Non authentifié | Rediriger vers la page de connexion |
| 403 | Non autorisé | Afficher "Accès interdit" |
| 404 | Type introuvable | Afficher "Type introuvable" |
| 409 | Conflit (déjà existant) | Afficher "Ce type existe déjà" |
| 500 | Erreur serveur | Afficher "Erreur serveur" |

### Exemple de gestion centralisée

```typescript
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    switch (status) {
      case 400:
        return Array.isArray(message)
          ? message.join(', ')
          : message || 'Données invalides';
      case 401:
        // Rediriger vers login
        window.location.href = '/login';
        return 'Session expirée';
      case 403:
        return 'Vous n\'avez pas les droits nécessaires';
      case 404:
        return message || 'Ressource introuvable';
      case 409:
        return message || 'Cette ressource existe déjà';
      case 500:
        return 'Erreur serveur, veuillez réessayer';
      default:
        return 'Une erreur est survenue';
    }
  }
  return 'Erreur inconnue';
};
```

---

## Tests avec Postman/Insomnia

### Collection Postman

```json
{
  "info": {
    "name": "Vendor Types API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Vendor Types",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/vendor-types",
          "host": ["{{baseUrl}}"],
          "path": ["vendor-types"]
        }
      }
    },
    {
      "name": "Create Vendor Type",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"label\": \"Photographe\",\n  \"description\": \"Spécialiste de la photographie professionnelle\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/vendor-types",
          "host": ["{{baseUrl}}"],
          "path": ["vendor-types"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3004/api"
    },
    {
      "key": "token",
      "value": "YOUR_JWT_TOKEN"
    }
  ]
}
```

---

## Checklist d'intégration Frontend

- [ ] Créer les types TypeScript
- [ ] Créer le service API `vendorTypeService.ts`
- [ ] Créer le hook `useVendorTypes.ts`
- [ ] Créer le composant de liste des types
- [ ] Créer le formulaire de création
- [ ] Créer le formulaire de modification
- [ ] Gérer la suppression avec confirmation
- [ ] Ajouter la gestion d'erreurs
- [ ] Ajouter les notifications (toast)
- [ ] Tester tous les scénarios (succès + erreurs)
- [ ] Intégrer dans le formulaire de création de vendeur

---

## Questions fréquentes

### Q: Puis-je modifier l'ancienne colonne `vendeur_type` ?
**R:** Non, elle est conservée pour la rétrocompatibilité. Utilisez maintenant `vendorTypeId` pour les nouvelles créations.

### Q: Que se passe-t-il si je supprime un type utilisé ?
**R:** L'API retourne une erreur 400 avec le nombre de vendeurs utilisant ce type. Vous devez d'abord réassigner les vendeurs à un autre type.

### Q: Les types sont-ils triés ?
**R:** Oui, par ordre alphabétique du `label`.

### Q: Puis-je avoir deux types avec le même nom ?
**R:** Non, le champ `label` est unique.

---

## Support

Pour toute question ou problème :
- Vérifiez que le backend est lancé sur le port 3004
- Vérifiez votre token JWT
- Consultez la documentation Swagger : `http://localhost:3004/api`

---

**Dernière mise à jour :** 2025-01-15
