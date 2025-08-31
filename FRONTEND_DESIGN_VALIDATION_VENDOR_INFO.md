# 🎨 Guide Frontend – Afficher les infos vendeur lors de la validation des designs

Depuis la mise à jour backend, chaque objet `DesignResponseDto` contient une clé `vendor` avec les informations complètes du vendeur :

```jsonc
{
  "id": 789,
  "name": "Pattern tropical",
  "thumbnailUrl": "…",
  "validationStatus": "PENDING",
  "vendor": {
    "id": 45,
    "firstName": "Marie",
    "lastName": "Dubois",
    "email": "marie.dubois@test.com",
    "shop_name": "Studio Marie Design",
    "phone": "+33 6 12 34 56 78",
    "profile_photo_url": "https://res.cloudinary.com/.../profile-photos/vendor_45.png",
    "country": "France",
    "address": "45 Av. des Champs-Élysées, 75008 Paris"
  }
}
```

---

## 1. Mise à jour des types

```ts
// src/types/design.ts
export interface VendorInfo {
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

export interface Design {
  id: number;
  name: string;
  thumbnailUrl?: string;
  validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
  vendor?: VendorInfo; // ⬅️ nouveau
  // … autres champs
}
```

---

## 2. Carte dans la liste « Designs à valider »

```tsx
// src/pages/admin/designs/PendingList.tsx
import defaultAvatar from '@/assets/default-avatar.png';

function PendingCard({ design }: { design: Design }) {
  const v = design.vendor;
  return (
    <div className="flex gap-4 p-4 bg-white shadow rounded">
      <img src={design.thumbnailUrl ?? design.imageUrl} className="w-24 h-24 object-cover rounded" />
      <div className="flex-1">
        <h3 className="font-semibold text-sm mb-1">{design.name}</h3>
        {v && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <img
              src={v.profile_photo_url || defaultAvatar}
              className="w-6 h-6 rounded-full object-cover"
              alt={v.firstName}
            />
            <span>{v.firstName} {v.lastName}</span>
            {v.shop_name && <span className="font-medium">— {v.shop_name}</span>}
          </div>
        )}
      </div>
      <button className="btn-primary" onClick={() => openModal(design)}>Voir</button>
    </div>
  );
}
```

---

## 3. Vue détail / modal validation

```tsx
function DesignValidationModal({ design }: { design: Design }) {
  const v = design.vendor;
  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <img src={design.imageUrl} className="w-full rounded" />

      {/* Infos vendeur */}
      {v && (
        <div className="flex gap-4 items-center">
          <img src={v.profile_photo_url || defaultAvatar} className="w-14 h-14 rounded-full" />
          <div>
            <p className="font-semibold">{v.firstName} {v.lastName}</p>
            {v.shop_name && <p className="text-sm text-gray-500">🏪 {v.shop_name}</p>}
            {v.phone && <p className="text-sm text-gray-500">📞 {v.phone}</p>}
            {v.country && <p className="text-sm text-gray-500">🌐 {v.country}</p>}
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-3 justify-end">
        <button className="btn-danger" onClick={() => reject(design.id)}>Rejeter</button>
        <button className="btn-primary" onClick={() => approve(design.id)}>Approuver</button>
      </div>
    </div>
  );
}
```

---

## 4. Fallbacks & accessibilité

* Afficher `defaultAvatar` si `profile_photo_url` est `null`.
* Tronquer les textes trop longs (`text-ellipsis`).
* Utiliser des icônes pour téléphone, pays, boutique.

---

## 5. Refresh des données après action

Après un **approve** ou **reject** :
1. Appelez l'endpoint `PATCH /designs/:id/validate`.
2. Refetch la liste `GET /designs/pending` (ou utilisez React Query `invalidateQueries`).

---

## 6. Bonus : filtre par vendeur

Ajoutez un champ recherche `vendor.shop_name` côté API : il suffit d'envoyer `search=Studio` (déjà supporté par le backend).

---

💡 Avec ces snippets, le panel d'administration affiche désormais toutes les informations du vendeur pour chaque design à valider, améliorant la prise de décision et l'expérience modérateurs. 