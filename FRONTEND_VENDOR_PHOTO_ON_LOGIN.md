# 📸 Affichage immédiat de la photo de profil vendeur après connexion

Ce document explique comment récupérer et afficher `profile_photo_url` dès que le vendeur se connecte (réponse du login) et maintenir la photo dans toute l'application.

---

## 1. Réponse de l'API `POST /auth/login`

Depuis la mise à jour backend, la réponse ressemble à :
```jsonc
{
  "user": {
    "id": 12,
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "VENDEUR",
    "status": true,
    "profile_photo_url": "https://res.cloudinary.com/.../profile-photos/vendor_12_123456.png"
  }
}
```
> Le champ `profile_photo_url` peut être `null` si aucun upload.

---

## 2. Stockage global (exemple React + Context API)

```ts
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState } from 'react';
interface User {
  id: number;
  firstName: string;
  lastName: string;
  profile_photo_url?: string | null;
  // … autres champs
}
interface AuthCtx { user: User | null; setUser: (u: User | null) => void; }
const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}
```

### Lors du login
```ts
const { setUser } = useAuth();
const res = await axios.post('/auth/login', credentials);
setUser(res.data.user); // contient déjà profile_photo_url
```

---

## 3. Composant Avatar universel

```tsx
// src/components/Avatar.tsx
import defaultAvatar from '@/assets/default-avatar.png';
import { useAuth } from '@/contexts/AuthContext';

export function Avatar({ size = 40 }: { size?: number }) {
  const { user } = useAuth();
  const src = user?.profile_photo_url || defaultAvatar;
  return <img src={src} width={size} height={size} style={{ borderRadius: '50%' }} alt="avatar" />;
}
```

---

## 4. Utilisation dans l'espace vendeur

Placez l'avatar dans le header principal :
```tsx
// src/layouts/VendorLayout.tsx
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <div className="flex flex-col h-screen">
      <header className="flex justify-between items-center px-6 bg-white shadow h-16">
        <h1 className="text-lg font-bold">Espace vendeur</h1>
        <div className="flex items-center gap-3">
          <Avatar size={32} />
          <span className="font-medium">{user?.firstName}</span>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

Le vendeur voit immédiatement sa photo après authentification.

---

## 5. Mise à jour en temps réel après upload

Lorsque le vendeur modifie sa photo :
1. Envoyez le fichier via `PUT /auth/vendor/profile` (`profilePhoto`).
2. Après succès, appelez `GET /auth/vendor/profile` et mettez à jour le contexte :
```ts
const fresh = await axios.get('/auth/vendor/profile');
setUser(fresh.data);
```
L'avatar se re-rendra automatiquement.

---

## 6. Fallback et accessibilité

- Utilisez un avatar générique (`defaultAvatar`) si l'URL est absente.
- Ajoutez `alt={user?.firstName ?? 'avatar'}` pour l'accessibilité.

---

✅ En suivant ces étapes, la photo du vendeur apparaît dès la connexion et reste synchronisée dans toute l'application. 