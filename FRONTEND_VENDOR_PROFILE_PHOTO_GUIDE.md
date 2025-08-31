# 🖼️ Guide d'intégration Frontend – Photo de profil vendeur

Ce document explique comment:
1. Récupérer l'URL `profile_photo_url` (nouveau champ)
2. Afficher la photo dans votre interface (React) 
3. Mettre à jour la photo via le formulaire de profil

---

## 1. Où se trouve l'URL ?

### A. Réponse de connexion
```jsonc
POST /auth/login
{
  "user": {
    "id": 12,
    "firstName": "Jean",
    "lastName": "Dupont",
    "profile_photo_url": "https://res.cloudinary.com/.../profile-photos/vendor_12_987654321.png"
  }
}
```

### B. Endpoints profil
- `GET /auth/profile` (tous rôles)  
- `GET /auth/vendor/profile` (vendeur uniquement)

Les deux renvoient le même champ.

---

## 2. Typage côté front

```ts
// src/types/auth.ts
export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'VENDEUR' | 'ADMIN' | 'SUPERADMIN';
  profile_photo_url?: string | null;
}
```

---

## 3. Stockage dans un contexte / store

```ts
// src/contexts/AuthContext.tsx
const AuthContext = createContext<AuthUser | null>(null);

// Au login :
setAuthUser(response.data.user);
```

Veillez à inclure `profile_photo_url` lors du `setAuthUser`.

---

## 4. Affichage dans un composant

```tsx
import defaultAvatar from '@/assets/default-avatar.png';

function UserAvatar({ size = 40 }: { size?: number }) {
  const user = useAuth();
  const src = user?.profile_photo_url || defaultAvatar;

  return (
    <img
      src={src}
      width={size}
      height={size}
      style={{ borderRadius: '50%', objectFit: 'cover' }}
      alt={user?.firstName || 'avatar'}
    />
  );
}
```

Utilisez ce composant :
```tsx
<header>
  <UserAvatar size={32} />
  <span>{user.firstName}</span>
</header>
```

---

## 5. Formulaire de mise à jour

### A. Exemple de hook
```ts
async function updateProfile(data: FormData) {
  await axios.put('/auth/vendor/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
```

### B. Construction du `FormData`
```ts
const form = new FormData();
form.append('shop_name', values.shop_name);
if (file) {
  form.append('profilePhoto', file); // ⚠️ nom EXACT demandé par l'API
}
await updateProfile(form);
```

Après succès :
```ts
const fresh = await axios.get<ExtendedVendorProfileResponseDto>('/auth/vendor/profile');
setAuthUser(prev => ({ ...prev, profile_photo_url: fresh.data.profile_photo_url }));
```

---

## 6. Cache & Cloudinary

Cloudinary versionne automatiquement l'URL (ex : `v1719480000`).  
Si la photo est remplacée, l'URL changera → pas besoin de bust manuel.

---

## 7. États de chargement / fallback

1. `profile_photo_url === null` → avatar générique.  
2. Lors du chargement initial, affichez un skeleton si nécessaire.

---

## 8. Test rapide avec curl

```bash
curl -X PUT http://localhost:3000/auth/vendor/profile \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: multipart/form-data" \
     -F "profilePhoto=@/chemin/vers/photo.png"
```

Vous recevrez `{ message: 'Profil mis à jour avec succès' }`. Récupérez ensuite le profil pour obtenir la nouvelle URL.

---

🎉 Vous avez maintenant la photo vendeur côté frontend ! 