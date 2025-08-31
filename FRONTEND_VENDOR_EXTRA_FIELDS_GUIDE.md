# 🛍️ Guide Frontend – Affichage des infos boutique (shop_name, phone, etc.)

Depuis la dernière mise à jour backend, les champs suivants sont envoyés dans toutes les réponses profil / login :

| Champ | Type | Exemple |
|-------|------|---------|
| `shop_name` | string \| null | "Studio Marie Design" |
| `phone` | string \| null | "+33 6 12 34 56 78" |
| `country` | string \| null | "France" |
| `address` | string \| null | "45 Av. des Champs-Élysées, 75008 Paris" |
| `profile_photo_url` | string \| null | `https://res.cloudinary.com/...` |

---

## 1. Mise à jour du type utilisateur

```ts
// src/types/auth.ts
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'VENDEUR' | 'ADMIN' | 'SUPERADMIN';
  profile_photo_url?: string | null;
  shop_name?: string | null;
  phone?: string | null;
  country?: string | null;
  address?: string | null;
}
```

> Pensez à ajuster le type global où il est utilisé (Contexte, Redux, Zustand…).

---

## 2. Contexte / Store

Le backend renvoie déjà ces champs au **login** et via **`GET /auth/profile`** (cookie httpOnly).  
Assurez-vous de stocker toute la structure :

```ts
setUser(res.data.user); // contient shop_name, phone…
```

---

## 3. Affichage rapide dans le header vendeur

```tsx
// src/layouts/VendorLayout.tsx
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';

function VendorHeader() {
  const { user } = useAuth();
  return (
    <header className="flex justify-between items-center px-6 h-16 bg-white shadow">
      <h1 className="text-lg font-bold">Espace vendeur</h1>
      <div className="flex items-center gap-3">
        <Avatar size={32} />
        <div className="flex flex-col leading-tight">
          <span className="font-medium">{user?.firstName}</span>
          <span className="text-xs text-gray-500 truncate max-w-[150px]">{user?.shop_name}</span>
        </div>
      </div>
    </header>
  );
}
```

---

## 4. Carte d’informations détaillées

```tsx
// src/components/VendorInfoCard.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from './Avatar';

export function VendorInfoCard() {
  const { user } = useAuth();

  return (
    <div className="p-6 bg-white shadow rounded flex gap-6">
      <Avatar size={80} />
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{user?.shop_name ?? 'Ma boutique'}</h2>
        <p className="text-gray-700">{user?.firstName} {user?.lastName}</p>
        {user?.phone && <p>📞 {user.phone}</p>}
        {user?.address && <p>📍 {user.address}</p>}
        {user?.country && <p>🌐 {user.country}</p>}
      </div>
    </div>
  );
}
```

Utilisation :
```tsx
<VendorInfoCard />
```

---

## 5. Formulaire d’édition

Le même endpoint `PUT /auth/vendor/profile` accepte `phone`, `country`, `address`, `shop_name` + `profilePhoto`.

```ts
const form = new FormData();
form.append('shop_name', values.shop_name);
form.append('phone', values.phone ?? '');
form.append('country', values.country ?? '');
form.append('address', values.address ?? '');
if (file) form.append('profilePhoto', file);
await api.put('/auth/vendor/profile', form);
```

Ensuite :
```ts
const fresh = await api.get('/auth/vendor/profile');
setUser(fresh.data);
```

---

## 6. Gestion du responsive

Dans le header, tronquez le `shop_name` si trop long (`text-ellipsis`). Dans la carte, laissez-le sur plusieurs lignes.

---

## 7. Bonne pratique UX

* Affichez un « 📞 Ajouter téléphone » ou « 🏪 Ajouter nom boutique » quand les champs sont `null`.
* Placez le bouton « Modifier profil » près de la carte `VendorInfoCard`.

---

🎉 Avec ces snippets, toutes les informations vendeur (photo, boutique, téléphone, adresse, pays) sont visibles et éditables côté frontend. 