# 🛒 Guide Frontend – Vue d'ensemble des produits vendeurs (Admin)

Ce guide montre comment récupérer et afficher, dans le panneau d'administration, **tous les produits publiés par les vendeurs**, enrichis avec leurs informations de profil (photo, boutique, téléphone, pays, adresse…).

---

## 1. Nouvel endpoint backend

```
GET /vendor/admin/products?limit=20&offset=0&status=all&search=tee
```

* Accès protégé : rôle `ADMIN` ou `SUPERADMIN`.
* Paramètres :
  * `limit` (par défaut 20, max 100)
  * `offset` (par défaut 0)
  * `status` : `all | published | draft`
  * `search` : recherche dans `vendorName` / `vendorDescription`.
* Réponse :

```jsonc
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 789,
        "vendorId": 45,
        "vendorName": "T-shirt Tropical",
        "price": 25000,
        "status": "PUBLISHED",
        "images": {
          "primaryImageUrl": "https://…/vendor-products/789_front.png"
        },
        "vendor": {
          "id": 45,
          "firstName": "Marie",
          "lastName": "Dubois",
          "email": "marie@test.com",
          "shop_name": "Studio Marie Design",
          "phone": "+33 6 12 34 56 78",
          "profile_photo_url": "https://…/profile-photos/45.png",
          "country": "France",
          "address": "45 Av. des Champs-Élysées, 75008 Paris"
        }
      }
    ],
    "pagination": {
      "total": 128,
      "limit": 20,
      "offset": 0,
      "page": 1,
      "totalPages": 7,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 2. Typage côté React

```ts
// src/types/vendor-product.ts
export interface VendorMiniInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  shop_name?: string | null;
  phone?: string | null;
  profile_photo_url?: string | null;
  country?: string | null;
  address?: string | null;
}

export interface VendorProductListItem {
  id: number;
  vendorId: number;
  vendorName: string;
  price: number;
  status: 'PUBLISHED' | 'DRAFT';
  images: {
    primaryImageUrl?: string | null;
  };
  vendor: VendorMiniInfo;
}
```

---

## 3. Récupération via React Query

```tsx
import { useQuery } from '@tanstack/react-query';
import axios from '@/utils/axiosSecure';

function useAdminVendorProducts(limit = 20, offset = 0, status = 'all', search = '') {
  return useQuery({
    queryKey: ['admin-vendor-products', limit, offset, status, search],
    queryFn: async () => {
      const { data } = await axios.get('/vendor/admin/products', {
        params: { limit, offset, status, search }
      });
      return data.data;
    }
  });
}
```

---

## 4. Composant liste

```tsx
function VendorProductRow({ product }: { product: VendorProductListItem }) {
  const v = product.vendor;
  return (
    <tr className="border-b last:border-none">
      <td className="p-3 w-[64px]">
        <img src={product.images.primaryImageUrl} className="w-16 h-16 rounded object-cover" />
      </td>
      <td className="p-3">
        <p className="font-medium text-sm">{product.vendorName}</p>
        <p className="text-xs text-gray-500">ID : {product.id}</p>
      </td>
      <td className="p-3 text-sm">
        <div className="flex items-center gap-2">
          <img src={v.profile_photo_url || '/img/default-avatar.png'} className="w-8 h-8 rounded-full object-cover" />
          <span>{v.firstName} {v.lastName}</span>
        </div>
        {v.shop_name && <p className="text-xs text-gray-400">🏪 {v.shop_name}</p>}
      </td>
      <td className="p-3 text-right font-semibold">{product.price / 100} €</td>
      <td className="p-3 text-center">
        <span className={`badge badge-${product.status === 'PUBLISHED' ? 'success' : 'ghost'}`}>{product.status}</span>
      </td>
    </tr>
  );
}
```

---

## 5. Vue détail produit vendeur

Utilisez l'endpoint existant `GET /vendor/products/:id` (déjà enrichi) ; les champs supplémentaires `phone`, `country`, `profile_photo_url`, etc. sont désormais disponibles.

---

## 6. Points d'attention UX

1. **Photos manquantes :** prévoir un avatar par défaut.
2. **Pagination infinie :** idéal avec le composant `useInfiniteQuery`.
3. **Filtres :** combiner `status` et `search` pour accélérer la modération.
4. **Sécurité :** le cookie JWT doit contenir le rôle admin ; sinon backend renverra 403.

---

🎉 Avec ce nouveau flux, les modérateurs disposent d'une vue complète sur les produits vendeurs, le profil de leurs créateurs et peuvent prendre des décisions éclairées rapidement. 