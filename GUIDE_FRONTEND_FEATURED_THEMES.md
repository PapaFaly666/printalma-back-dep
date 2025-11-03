# Guide d'Intégration Frontend - Featured Themes API

## 📋 Vue d'ensemble

Ce document décrit comment intégrer l'API des thèmes en vedette (Featured Themes) dans le frontend. Cette fonctionnalité permet aux admins de sélectionner jusqu'à 5 catégories de design à afficher en priorité sur le landing page.

## 🔗 Endpoints disponibles

### 1. Récupérer les thèmes en vedette (Public)

**Endpoint:** `GET /design-categories/featured`
**Authentification:** Non requise (Public)
**Description:** Récupère les catégories marquées comme "en vedette" pour affichage sur le landing page

#### Exemple de requête

```typescript
const response = await fetch('http://localhost:3004/design-categories/featured');
const featuredCategories = await response.json();
```

#### Réponse (200 OK)

```json
[
  {
    "id": 1,
    "name": "Mangas",
    "description": "",
    "slug": "mangas",
    "coverImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1761751562/design-categories/1761751560979-Episode_012-07.jpg",
    "isActive": true,
    "sortOrder": 0,
    "designCount": 1,
    "isFeatured": true,
    "featuredOrder": 1,
    "createdAt": "2025-10-29T15:26:04.158Z",
    "updatedAt": "2025-10-31T11:21:59.402Z",
    "creator": {
      "id": 1,
      "firstName": "Papa Faly",
      "lastName": "Diagne"
    }
  },
  {
    "id": 3,
    "name": "Sports",
    "description": "Catégorie pour designs sportifs",
    "slug": "sports",
    "coverImageUrl": "https://res.cloudinary.com/...",
    "isActive": true,
    "sortOrder": 0,
    "designCount": 5,
    "isFeatured": true,
    "featuredOrder": 2,
    "createdAt": "2025-10-31T10:32:06.713Z",
    "updatedAt": "2025-10-31T11:21:59.810Z",
    "creator": {
      "id": 1,
      "firstName": "Papa Faly",
      "lastName": "Diagne"
    }
  }
]
```

#### Champs importants

- `featuredOrder`: Ordre d'affichage (1 = premier, 2 = deuxième, etc.)
- `isFeatured`: Toujours `true` pour les résultats de cet endpoint
- `coverImageUrl`: Image de couverture de la catégorie
- `designCount`: Nombre de designs dans cette catégorie

---

### 2. Mettre à jour les thèmes en vedette (Admin)

**Endpoint:** `PUT /design-categories/featured/update`
**Authentification:** Requise (Admin uniquement)
**Description:** Met à jour la liste et l'ordre des catégories en vedette

#### ⚠️ IMPORTANT - Changement d'URL

L'URL a été changée de :
- ❌ **Ancienne URL:** `/design-categories/admin/featured`
- ✅ **Nouvelle URL:** `/design-categories/featured/update`

#### Headers requis

```typescript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
  // Ou si vous utilisez des cookies HTTP-only, le cookie sera envoyé automatiquement
}
```

#### Body de la requête

```json
{
  "categoryIds": ["1", "3", "5"]
}
```

**Notes importantes:**
- Les IDs peuvent être envoyés en **strings** ou en **numbers** - le backend les convertit automatiquement
- Maximum **5 catégories** autorisées
- L'ordre dans le tableau détermine l'ordre d'affichage (index 0 = premier, index 1 = deuxième, etc.)

#### Exemple de requête avec Axios

```typescript
import axios from 'axios';

const updateFeaturedCategories = async (categoryIds: number[]) => {
  try {
    const response = await axios.put(
      'http://localhost:3004/design-categories/featured/update',
      {
        categoryIds: categoryIds.map(String) // Convertir en strings
      },
      {
        withCredentials: true, // Important pour envoyer les cookies
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    throw error;
  }
};
```

#### Exemple de requête avec Fetch

```typescript
const updateFeaturedCategories = async (categoryIds: number[]) => {
  try {
    const response = await fetch(
      'http://localhost:3004/design-categories/featured/update',
      {
        method: 'PUT',
        credentials: 'include', // Important pour envoyer les cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryIds: categoryIds.map(String) // Convertir en strings
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    throw error;
  }
};
```

#### Réponse (200 OK)

Retourne un tableau des catégories mises à jour, dans l'ordre de leur `featuredOrder` :

```json
[
  {
    "id": 1,
    "name": "Mangas",
    "description": "",
    "slug": "mangas",
    "coverImageUrl": "https://...",
    "isActive": true,
    "sortOrder": 0,
    "designCount": 1,
    "isFeatured": true,
    "featuredOrder": 1,
    "createdAt": "2025-10-29T15:26:04.158Z",
    "updatedAt": "2025-10-31T11:21:59.402Z",
    "creator": {
      "id": 1,
      "firstName": "Papa Faly",
      "lastName": "Diagne"
    }
  },
  // ... autres catégories
]
```

#### Erreurs possibles

##### 400 Bad Request - Validation échouée

```json
{
  "message": "Maximum 5 thèmes autorisés",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Causes possibles:**
- Plus de 5 catégories envoyées
- Tableau vide (`categoryIds.length === 0`)
- IDs invalides (pas des nombres)

##### 400 Bad Request - Catégories inexistantes

```json
{
  "message": "Les catégories suivantes n'existent pas: 99, 100",
  "error": "Bad Request",
  "statusCode": 400
}
```

##### 400 Bad Request - Catégories inactives

```json
{
  "message": "Les catégories suivantes sont inactives et ne peuvent pas être en vedette: Logo Design, T-Shirts",
  "error": "Bad Request",
  "statusCode": 400
}
```

##### 401 Unauthorized

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

**Cause:** Token JWT invalide ou manquant

##### 403 Forbidden

```json
{
  "message": "Forbidden resource",
  "statusCode": 403
}
```

**Cause:** L'utilisateur n'a pas les droits administrateur

---

## 🎨 Exemple d'implémentation complète (React + TypeScript)

### Service API

```typescript
// services/designCategoryService.ts

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004';

export interface DesignCategory {
  id: number;
  name: string;
  description: string;
  slug: string;
  coverImageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  designCount: number;
  isFeatured?: boolean;
  featuredOrder?: number | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

class DesignCategoryService {
  /**
   * Récupère les catégories en vedette (Public)
   */
  async getFeaturedCategories(): Promise<DesignCategory[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/design-categories/featured`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des thèmes en vedette:', error);
      throw error;
    }
  }

  /**
   * Met à jour les catégories en vedette (Admin uniquement)
   */
  async updateFeaturedCategories(categoryIds: number[]): Promise<DesignCategory[]> {
    try {
      // Validation côté client
      if (categoryIds.length === 0) {
        throw new Error('Au moins 1 catégorie doit être sélectionnée');
      }

      if (categoryIds.length > 5) {
        throw new Error('Maximum 5 thèmes autorisés');
      }

      const response = await axios.put(
        `${API_BASE_URL}/design-categories/featured/update`,
        {
          categoryIds: categoryIds.map(String) // Convertir en strings
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Récupère toutes les catégories actives (pour la sélection)
   */
  async getActiveCategories(): Promise<DesignCategory[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/design-categories/active`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  }
}

export default new DesignCategoryService();
```

### Composant React - Affichage Landing Page

```tsx
// components/FeaturedThemes.tsx

import React, { useEffect, useState } from 'react';
import designCategoryService, { DesignCategory } from '../services/designCategoryService';

export const FeaturedThemes: React.FC = () => {
  const [featuredCategories, setFeaturedCategories] = useState<DesignCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeaturedCategories();
  }, []);

  const loadFeaturedCategories = async () => {
    try {
      setLoading(true);
      const categories = await designCategoryService.getFeaturedCategories();
      setFeaturedCategories(categories);
      setError(null);
    } catch (err) {
      setError('Impossible de charger les thèmes en vedette');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Chargement des thèmes tendances...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (featuredCategories.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas de thèmes en vedette
  }

  return (
    <section className="featured-themes">
      <h2>Thèmes Tendances</h2>
      <div className="themes-grid">
        {featuredCategories.map((category) => (
          <div key={category.id} className="theme-card">
            <img
              src={category.coverImageUrl || '/default-image.jpg'}
              alt={category.name}
            />
            <h3>{category.name}</h3>
            {category.description && <p>{category.description}</p>}
            <span className="design-count">{category.designCount} designs</span>
          </div>
        ))}
      </div>
    </section>
  );
};
```

### Composant React - Gestion Admin

```tsx
// components/admin/FeaturedThemesManager.tsx

import React, { useEffect, useState } from 'react';
import designCategoryService, { DesignCategory } from '../../services/designCategoryService';

export const FeaturedThemesManager: React.FC = () => {
  const [allCategories, setAllCategories] = useState<DesignCategory[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger toutes les catégories actives
      const categories = await designCategoryService.getActiveCategories();
      setAllCategories(categories);

      // Récupérer les IDs actuellement en vedette
      const featured = await designCategoryService.getFeaturedCategories();
      const featuredIds = featured
        .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))
        .map(cat => cat.id);

      setSelectedIds(featuredIds);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = (categoryId: number) => {
    setSelectedIds(prev => {
      if (prev.includes(categoryId)) {
        // Retirer de la sélection
        return prev.filter(id => id !== categoryId);
      } else {
        // Ajouter à la sélection (max 5)
        if (prev.length >= 5) {
          setError('Maximum 5 thèmes autorisés');
          return prev;
        }
        return [...prev, categoryId];
      }
    });
    setError(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...selectedIds];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setSelectedIds(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === selectedIds.length - 1) return;
    const newOrder = [...selectedIds];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setSelectedIds(newOrder);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await designCategoryService.updateFeaturedCategories(selectedIds);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
      console.error('Erreur lors de la sauvegarde:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && allCategories.length === 0) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="featured-themes-manager">
      <h2>Gérer les Thèmes en Vedette</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">Thèmes mis à jour avec succès !</div>}

      <div className="info-box">
        <p>Sélectionnez jusqu'à 5 catégories à afficher en vedette sur le landing page.</p>
        <p>L'ordre d'affichage correspond à l'ordre de sélection.</p>
      </div>

      <div className="manager-layout">
        {/* Liste des catégories disponibles */}
        <div className="available-categories">
          <h3>Catégories Disponibles</h3>
          <div className="categories-list">
            {allCategories.map((category) => (
              <div
                key={category.id}
                className={`category-item ${selectedIds.includes(category.id) ? 'selected' : ''}`}
                onClick={() => handleToggleCategory(category.id)}
              >
                <img src={category.coverImageUrl || '/default.jpg'} alt={category.name} />
                <div>
                  <strong>{category.name}</strong>
                  <span>{category.designCount} designs</span>
                </div>
                {selectedIds.includes(category.id) && (
                  <span className="badge">
                    #{selectedIds.indexOf(category.id) + 1}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Liste des catégories sélectionnées avec ordre */}
        <div className="selected-categories">
          <h3>Thèmes en Vedette ({selectedIds.length}/5)</h3>
          <div className="selected-list">
            {selectedIds.map((id, index) => {
              const category = allCategories.find(cat => cat.id === id);
              if (!category) return null;

              return (
                <div key={id} className="selected-item">
                  <span className="order-number">{index + 1}</span>
                  <img src={category.coverImageUrl || '/default.jpg'} alt={category.name} />
                  <span className="category-name">{category.name}</span>
                  <div className="actions">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === selectedIds.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleToggleCategory(id)}
                      className="remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSave}
            disabled={loading || selectedIds.length === 0}
            className="btn-save"
          >
            {loading ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 🔒 Sécurité et Authentification

### Cookies HTTP-only (Recommandé)

Le backend utilise des cookies HTTP-only pour l'authentification. Assurez-vous que :

```typescript
// Dans votre configuration Axios
axios.defaults.withCredentials = true;

// Ou pour chaque requête
axios.get(url, { withCredentials: true });
```

### Headers CORS

Le backend accepte les requêtes depuis :
- `http://localhost:5174` (dev)
- `https://printalma-website-dep.onrender.com` (production)

---

## 📝 Notes importantes

1. **Conversion automatique:** Le backend accepte les IDs en strings (`["1", "2"]`) ou en numbers (`[1, 2]`)

2. **Ordre d'affichage:** L'ordre des IDs dans le tableau `categoryIds` détermine l'ordre d'affichage (premier élément = `featuredOrder: 1`)

3. **Validation:** Le backend valide que :
   - Maximum 5 catégories
   - Au moins 1 catégorie
   - Tous les IDs existent dans la base de données
   - Toutes les catégories sont actives (`isActive: true`)

4. **Transaction atomique:** La mise à jour utilise une transaction Prisma pour garantir la cohérence des données

5. **URL changée:** N'oubliez pas d'utiliser `/design-categories/featured/update` et non `/design-categories/admin/featured`

---

## 🐛 Debugging

### Vérifier la connexion

```bash
curl http://localhost:3004/design-categories/featured
```

### Tester la mise à jour (avec authentification)

```bash
curl -X PUT http://localhost:3004/design-categories/featured/update \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"categoryIds": ["1", "3"]}'
```

### Vérifier les logs backend

```bash
# Rechercher les erreurs
grep -i "error" logs/app.log

# Voir les requêtes
grep "PUT.*featured" logs/app.log
```

---

## 📞 Support

En cas de problème, vérifiez :
1. ✅ L'URL utilisée est bien `/design-categories/featured/update`
2. ✅ Les cookies sont envoyés (`withCredentials: true`)
3. ✅ L'utilisateur est authentifié en tant qu'admin
4. ✅ Les IDs des catégories existent et sont actives
5. ✅ Le backend est bien démarré sur le port 3004

---

**Date de création:** 31 Octobre 2025
**Version API:** 1.0
**Backend:** NestJS + Prisma + PostgreSQL
