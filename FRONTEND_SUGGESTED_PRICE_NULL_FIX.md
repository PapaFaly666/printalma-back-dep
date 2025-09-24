## Frontend — Corriger `suggested_price`/`suggestedPrice` à `null`

Problème
- L'API peut renvoyer `suggestedPrice` (camelCase) ou `suggested_price` (snake_case) selon l'environnement/clients, et parfois à `null`.
- Le formulaire reçoit donc une valeur vide/non numérique, et le champ n'est pas pris en compte.

Objectif
- Normaliser la donnée côté frontend, pré-remplir correctement le `price` si pertinent, et éviter de renvoyer `null` dans les payloads.

Stratégie
- Normaliser TOUTES les réponses produits via des utilitaires.
- Nettoyer TOUTES les requêtes (POST/PATCH) pour ne pas envoyer `null`/`''`.
- Gestion de formulaire: valeurs contrôlées, conversions number/'' propres.

Utils de normalisation
```ts
// src/utils/productNormalization.ts
export type AnyProduct = Record<string, any>;

function toNumberOrUndefined(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export function normalizeProductFromApi(apiProduct: AnyProduct) {
  // Supporter snake_case et camelCase en entrée
  const suggestedRaw = apiProduct?.suggestedPrice ?? apiProduct?.suggested_price ?? null;

  return {
    ...apiProduct,
    // Forcer camelCase côté app
    suggestedPrice: toNumberOrUndefined(suggestedRaw),
  };
}

export function prepareProductPayload(formValues: AnyProduct) {
  const payload: AnyProduct = { ...formValues };

  // Conversions safe pour l'API (camelCase attendu côté backend)
  if ('suggestedPrice' in payload) {
    const num = toNumberOrUndefined(payload.suggestedPrice);
    if (num === undefined) {
      // Ne pas envoyer le champ si vide
      delete payload.suggestedPrice;
    } else {
      payload.suggestedPrice = num;
    }
  }

  if ('price' in payload) {
    const num = toNumberOrUndefined(payload.price);
    if (num === undefined) delete payload.price; else payload.price = num;
  }

  // Supprimer TOUTES les valeurs null/undefined/'' superflues
  Object.keys(payload).forEach((k) => {
    const v = payload[k];
    if (v === null || v === undefined || v === '') delete payload[k];
  });

  return payload;
}
```

Service API (intercepteurs de normalisation facultatifs)
```ts
// src/services/api.ts
import axios from 'axios';
import { normalizeProductFromApi } from '../utils/productNormalization';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3004',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use((res) => {
  // Normaliser les charges utiles produits connues
  const url = res.config?.url || '';
  if (url.startsWith('/products')) {
    if (Array.isArray(res.data?.data)) {
      res.data.data = res.data.data.map(normalizeProductFromApi);
    } else if (res.data && typeof res.data === 'object') {
      res.data = normalizeProductFromApi(res.data);
    }
  }
  return res;
});
```

Usage côté service produits
```ts
// src/services/productService.ts
import { api } from './api';
import { prepareProductPayload } from '../utils/productNormalization';

export async function createProduct(values: any) {
  const payload = prepareProductPayload(values);
  const { data } = await api.post('/products', payload);
  return data;
}

export async function updateProduct(productId: number, values: any) {
  const payload = prepareProductPayload(values);
  const { data } = await api.patch(`/products/${productId}`, payload);
  return data;
}
```

Formulaire — valeurs contrôlées robustes
```tsx
// src/components/admin/products/ProductFormMain.tsx
import React, { useEffect } from 'react';

type Values = {
  price: number | '';
  suggestedPrice?: number | '';
};

export function ProductFormMain({ values, setFieldValue, mode, initialData }: any) {
  // initialData est déjà normalisé par l'intercepteur (suggestedPrice number | undefined)

  // Pré-remplir price si vide et suggestedPrice disponible
  useEffect(() => {
    if ((values.price === '' || values.price === undefined) && typeof values.suggestedPrice === 'number') {
      setFieldValue('price', values.suggestedPrice);
    }
  }, [values.price, values.suggestedPrice, setFieldValue]);

  return (
    <>
      <label>Prix suggéré (FCFA)</label>
      <input
        type="number"
        step="0.01"
        value={values.suggestedPrice ?? ''}
        onChange={(e) => setFieldValue('suggestedPrice', e.target.value === '' ? '' : Number(e.target.value))}
      />

      <label>Prix (FCFA)</label>
      <input
        type="number"
        step="0.01"
        required
        value={values.price ?? ''}
        onChange={(e) => setFieldValue('price', e.target.value === '' ? '' : Number(e.target.value))}
      />
    </>
  );
}
```

Règles de validation (exemple Yup)
```ts
import * as yup from 'yup';

export const productSchema = yup.object({
  price: yup.number().typeError('Prix invalide').min(0).required(),
  suggestedPrice: yup.number().typeError('Prix suggéré invalide').min(0).nullable().notRequired(),
});
```

Bonnes pratiques
- Ne jamais envoyer `null`/`''` dans les payloads: supprimer le champ.
- Toujours convertir les entrées en nombres via `Number()` et vérifier `isFinite`.
- Côté affichage, tester `product.suggestedPrice != null` avant de formatter.

Checklist debug
- Network → la réponse GET produit doit avoir `suggestedPrice` (camelCase) ou être absent; jamais `null` après normalisation.
- Payload POST/PATCH → ne contient `suggestedPrice` que si numérique; sinon le champ est absent.
- Form → si `suggestedPrice` est vide, pas de pré-remplissage forcé.






















