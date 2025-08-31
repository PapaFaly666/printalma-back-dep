# Guide Frontend – Produits vendeurs groupés par catégorie (productType)

## 1. Endpoint REST

```
GET /api/vendor/products/grouped
```

### 1.1. Paramètres de requête

| Paramètre        | Type    | Par défaut | Description                                                                                         |
|------------------|---------|-----------|-----------------------------------------------------------------------------------------------------|
| `vendorId`       | number  | *null*    | Limite aux produits d'un vendeur spécifique.                                                        |
| `status`         | string  | `all`     | Filtre sur le statut de publication (`PUBLISHED`, `DRAFT`, `all`).                                   |
| `search`         | string  | *null*    | Terme de recherche plein-texte (nom, description, nom du produit de base…).                         |
| `productType`    | string  | *null*    | Nom EXACT (insensible à la casse) du produit de base : **Tshirt**, **Casquette**, **Mug**, etc.      |

> 🆕 **productType** permet de récupérer uniquement un groupe précis (ex. Casquette).

### 1.2. En-tête HTTP

```
Authorization: Bearer <access_token>
```

Le token JWT provient de `/api/auth/login`.

### 1.3. Exemple d'appel (axios)

```ts
import axios from 'axios';

async function getCapsOnly(token: string) {
  const res = await axios.get(
    '/api/vendor/products/grouped',
    {
      params: { productType: 'Casquette', status: 'PUBLISHED' },
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.data; // { success, data: { Casquette: [...] }, statistics }
}
```

---

## 2. Structure de réponse

```jsonc
{
  "success": true,
  "data": {
    "Casquette": [
      {
        "id": 42,
        "vendorName": "Casquette Noir Logo",
        "price": 12000,
        "selectedSizes": [{ "id": 1, "sizeName": "TU" }],
        "selectedColors": [{ "id": 5, "name": "Noir", "colorCode": "#000000" }],
        "images": {
          "total": 3,
          "colorImages": {
            "Noir": [{ "url": "https://res.cloudinary.com/..." }]
          },
          "primaryImageUrl": "https://res.cloudinary.com/..."
        },
        "vendor": {
          "id": 7,
          "fullName": "Jean Vendeur",
          "shop_name": "Boutique JV"
        }
      }
    ]
  },
  "statistics": {
    "totalProducts": 4,
    "totalGroups": 1,
    "groupCounts": { "Casquette": 4 }
  }
}
```

### Points clés côté UI
1. `Object.entries(data)` fournit les groupes (une entrée par `baseProduct.name`).
2. Afficher `statistics` pour badges (total produits, groupes, etc.).
3. Pour un produit :
   * `vendorName`, `price` – infos principales.
   * `selectedSizes` et `selectedColors` – listes à afficher.
   * `images.primaryImageUrl` – miniature principale.
   * `images.colorImages` – galerie par couleur.

---

## 3. Utilisation dans React (hook)

```tsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export function useGroupedProducts(options) {
  const [state, setState] = useState({ loading: true, data: {}, stats: null, error: null });

  useEffect(() => {
    (async () => {
      try {
        setState(s => ({ ...s, loading: true }));
        const token = localStorage.getItem('access_token');
        const res = await axios.get('/api/vendor/products/grouped', {
          params: options,
          headers: { Authorization: `Bearer ${token}` }
        });
        setState({ loading: false, data: res.data.data, stats: res.data.statistics, error: null });
      } catch (e) {
        setState({ loading: false, data: {}, stats: null, error: e.response?.data?.message || e.message });
      }
    })();
  }, [JSON.stringify(options)]);

  return state;
}
```

---

## 4. Bonnes pratiques
- Toujours passer `status=PUBLISHED` côté catalogue public.
- Appliquer `productType` pour filtrer l'onglet/catégorie actuellement affiché.
- Prévoir un fallback si le groupe n'existe pas (`Object.keys(data).length === 0`).
- Les noms de produit de base sont renvoyés tels quels depuis la BDD – prévoir `toLowerCase()` ou capitalisation en UI pour harmoniser.

---

## 5. Checklist d'intégration
- [ ] Appel avec token JWT valide.
- [ ] Gestion du chargement / erreur.
- [ ] Passage dynamique des filtres `productType`, `vendorId`, `status`, `search`.
- [ ] Affichage des statistiques.
- [ ] Parcours des groupes puis des produits.

---

*Dernière mise à jour : {{date}}* 