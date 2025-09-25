## Frontend — Intégration du champ "Prix suggéré" (suggestedPrice)

Objectif
- Ajouter et utiliser `suggestedPrice` pour pré-remplir le champ `price` dans le formulaire d’ajout/édition produit côté admin.

Contexte
- Page: `/admin/add-product` (ou édition) → composant `ProductFormMain`.
- Backend expose `suggestedPrice` dans les endpoints produits (POST/PATCH/GET).
- Authentification: cookies HttpOnly + `withCredentials: true`.

Contrat API
- Entrée (POST /products, PATCH /products/:id): accepter `suggestedPrice?: number`.
- Sortie (GET /products, GET /products/:id): renvoyer `suggestedPrice?: number`.

Bonnes pratiques
- Ne pas stocker de token côté frontend; utiliser `withCredentials: true` sur toutes les requêtes.
- Utiliser `suggestedPrice` uniquement comme valeur par défaut de `price` côté UI; l’admin reste libre d’éditer `price`.

Service API (axios)
```ts
// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3004',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

Endpoints produits (exemple minimal)
```ts
// src/services/productService.ts
import { api } from './api';

export async function createProduct(payload: any) {
  // payload peut contenir suggestedPrice (optionnel) et price (effectif)
  const { data } = await api.post('/products', payload);
  return data;
}

export async function updateProduct(productId: number, payload: any) {
  const { data } = await api.patch(`/products/${productId}`, payload);
  return data;
}

export async function getProduct(productId: number) {
  const { data } = await api.get(`/products/${productId}`);
  return data; // { id, name, price, suggestedPrice, ... }
}
```

Formulaire — pré-remplissage `price` depuis `suggestedPrice`
```tsx
// src/components/admin/products/ProductFormMain.tsx
import React, { useEffect } from 'react';

type ProductFormValues = {
  name: string;
  description: string;
  price: number | '';
  suggestedPrice?: number | '';
  // ... autres champs
};

export function ProductFormMain({ values, setFieldValue, mode, initialData }: {
  values: ProductFormValues;
  setFieldValue: (field: string, value: any) => void;
  mode: 'create' | 'edit';
  initialData?: any; // réponse GET produit
}) {
  // 1) En création: si suggestedPrice est fourni (par calcul serveur ou UI), pré-remplir price
  useEffect(() => {
    if (mode === 'create') {
      if (values.suggestedPrice != null && values.suggestedPrice !== '' && (values.price == null || values.price === '')) {
        setFieldValue('price', Number(values.suggestedPrice));
      }
    }
  }, [mode, values.suggestedPrice, values.price, setFieldValue]);

  // 2) En édition: charger le produit et appliquer suggestedPrice → price s'il n'y a pas encore de price saisi
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const sp = initialData.suggestedPrice;
      if (sp != null && (values.price == null || values.price === '')) {
        setFieldValue('price', Number(sp));
      }
      if (sp != null && (values.suggestedPrice == null || values.suggestedPrice === '')) {
        setFieldValue('suggestedPrice', Number(sp));
      }
    }
  }, [mode, initialData, values.price, values.suggestedPrice, setFieldValue]);

  // Champ UI (exemple minimal)
  return (
    <div>
      {/* Champ prix suggéré (optionnel) */}
      <label>Prix suggéré (FCFA)</label>
      <input
        type="number"
        step="0.01"
        value={values.suggestedPrice ?? ''}
        onChange={(e) => setFieldValue('suggestedPrice', e.target.value === '' ? '' : Number(e.target.value))}
        placeholder="Ex: 7500"
      />

      {/* Champ prix effectif */}
      <label>Prix (FCFA)</label>
      <input
        type="number"
        step="0.01"
        value={values.price ?? ''}
        onChange={(e) => setFieldValue('price', e.target.value === '' ? '' : Number(e.target.value))}
        placeholder="Ex: 7500"
        required
      />
    </div>
  );
}
```

Construction du payload
```ts
// Création
await createProduct({
  name,
  description,
  price,              // requis (valeur finale)
  suggestedPrice,     // optionnel
  categories,
  sizes,
  // ... colorVariations, etc.
});

// Édition
await updateProduct(productId, {
  // Mettez uniquement les champs à mettre à jour
  price,              // si modifié
  suggestedPrice,     // si modifié
});
```

Logique de fallback recommandée
- Si `price` n’est pas saisi et que `suggestedPrice` est défini → pré-remplir `price` avec `suggestedPrice`.
- L’admin peut toujours modifier `price` après pré-remplissage.

Affichage (liste/détails)
```tsx
// Exemple: afficher un badge si suggestedPrice existe
{product.suggestedPrice != null && (
  <span className="badge">Prix suggéré: {product.suggestedPrice.toLocaleString()} FCFA</span>
)}
```

Vérifications & Débogage
- Auth: toutes les requêtes partent avec `withCredentials: true`.
- CORS: le backend doit autoriser l’origin exact + `credentials: true`.
- Network (DevTools): vérifier que `suggestedPrice` apparaît dans la réponse GET produit et part bien dans le body POST/PATCH.

Tests manuels
- Création: saisir `suggestedPrice` → vérifier que `price` est pré-rempli et que l’objet renvoyé contient `suggestedPrice`.
- Édition: sur un produit existant avec `suggestedPrice`, ouvrir le formulaire → `price` doit se pré-remplir si vide.

Notes
- `suggestedPrice` est purement indicatif; seul `price` est utilisé pour la vente effective.
- Le backend peut un jour calculer automatiquement `suggestedPrice` (coût + marge) et l’exposer tel quel.


























