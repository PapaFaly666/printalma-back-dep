# 🔐 Guide Frontend — Connexion, Authentification & Déconnexion (v2.2)

**Date :** 12 juin 2025  
**Version Backend API :** 2.2  
**Auteur :** Équipe Backend

---

## 1. 🧭 Vue d'ensemble
Ce document regroupe **tous** les points clés concernant la connexion utilisateur côté Frontend :

* Authentification (login) via cookies _HttpOnly_.
* Gestion des erreurs & verrouillage de compte.
* Contexte React & protection de routes.
* Déconnexion sécurisée.
* Rafraîchissement de session & _checkAuth_.
* Authentification WebSocket via cookies.

> Les guides plus détaillés (`FRONTEND_LOGIN_ERROR_HANDLING.md`, `FRONTEND_VENDEUR_PROFILE_LOGOUT.md`, `GUIDE_FRONTEND_WEBSOCKET_COOKIES.md`) restent valides ; ce fichier sert de **référence centralisée**.

---

## 2. 🔗 Endpoints Authentification
| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/auth/login` | Authentifie l'utilisateur, place un cookie `access_token` (_HttpOnly, Secure, SameSite=Lax_) et renvoie les infos utilisateur. |
| `GET` | `/auth/check` | Vérifie la validité du cookie, renvoie `{ isAuthenticated, user }`. |
| `GET` | `/auth/profile` | Renvoie le profil complet (auth requise). |
| `POST` | `/auth/logout` | Invalide le cookie côté serveur & navigateur. |
| `POST` | `/auth/refresh` | Optionnel : renouvelle le cookie si proche de l'expiration. |

> Toutes les requêtes doivent être faites avec `credentials: "include"` pour que le cookie soit envoyé.

---

## 3. 🍪 Tokens & Cookies
1. **`access_token`** : JWT chiffré, durée 10 h, stocké en **HttpOnly** (_donc inaccessible au JS_), renouvelé automatiquement si < 1h restante.
2. Le cookie est placé au **path `/`**, `Secure` en production, `SameSite=Lax`.
3. Aucun stockage `localStorage`/`sessionStorage` n'est requis.

---

## 4. 🔑 Flux de Connexion
```typescript
// src/services/authService.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3004',
  withCredentials: true, // ⭐ cookies envoyés automatiquement
  timeout: 10000
});

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data; // { user: {...} }
}
```

### Exemple d'utilisation React
```tsx
// src/pages/LoginPage.tsx
import { useState } from 'react';
import { login } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      setUser(res.user); // 🎉 connecté
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* champs email / password */}
      {error && <p className="error">{error}</p>}
      <button disabled={loading}>{loading ? '...' : 'Se connecter'}</button>
    </form>
  );
}
```

---

## 5. ⚠️ Gestion des Erreurs de Connexion
| Code | Message Exemple | Interprétation | Action recommandée |
|------|-----------------|----------------|--------------------|
| 401 | "Email ou mot de passe incorrect" | Identifiants invalides | Afficher message 🔴 |
| 401 | "Il vous reste 3 tentatives" | Tentatives restantes | Message ⚠️ + compteur |
| 401 | "Dernière tentative" | Avertissement critique | Message 🚨 |
| 401 | "Votre compte est temporairement verrouillé. Temps restant : 25 min" | Compte verrouillé | Désactiver bouton + minuterie |
| 401 | "Votre compte a été désactivé" | Compte désactivé | Contacter support |
| 200 | `{ mustChangePassword: true }` | Changement mot de passe requis | Rediriger vers `/change-password` |

Reportez-vous à `FRONTEND_LOGIN_ERROR_HANDLING.md` pour un **service complet** de catégorisation.

---

## 6. 🏠 Contexte Auth & Protection de Routes
```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/authService';

interface AuthCtx {
  user: any | null;
  setUser: (u: any | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérification initiale
  useEffect(() => {
    (async () => {
      try {
        const { isAuthenticated, user: u } = (await api.get('/auth/check')).data;
        if (isAuthenticated) setUser(u);
      } catch (_) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Route Privée (React-Router v6)
```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p>Chargement...</p>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
```

---

## 7. 🚪 Déconnexion Sécurisée
```typescript
export async function logout() {
  await api.post('/auth/logout');
}
```

```tsx
// Exemple bouton
import { logout } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

function LogoutButton() {
  const { setUser } = useAuth();
  return (
    <button onClick={async () => { await logout(); setUser(null); window.location.href = '/login'; }}>
      Se déconnecter
    </button>
  );
}
```

> Le backend efface le cookie, aucun autre nettoyage n'est requis.

---

## 8. 🌐 Authentification WebSocket
Le serveur WebSocket lit le même cookie `access_token`. Il suffit de déclarer `withCredentials: true` dans le client `socket.io` :
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3004/orders', { withCredentials: true });
```
Pour une implémentation prête-à-l'emploi, consultez `GUIDE_FRONTEND_WEBSOCKET_COOKIES.md`.

---

## 9. 🔄 Rafraîchissement de Session (optionnel)
Si l'API `/auth/refresh` est activée :
```typescript
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config.__isRetryRequest) {
      try {
        await api.post('/auth/refresh');
        err.config.__isRetryRequest = true;
        return api(err.config); // re-essaye
      } catch (_) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
```

---

## 10. ✅ Checklist d'Intégration
1. Toutes les requêtes HTTP ⇒ `withCredentials: true`.
2. Toujours gérer **401** (rediriger vers `/login`).
3. Afficher les messages d'erreur en français (voir section 5).
4. Ne jamais stocker le JWT dans `localStorage`.
5. Après login réussie ⇒ recharger profil ou `/auth/check`.
6. Utiliser `ProtectedRoute` pour sécuriser les pages privées.
7. Appeler `logout()` avant de supprimer manuellement des données locales.
8. Pour WebSocket ⇒ `withCredentials: true` + gestion `connect_error 401`.

---

## 11. FAQ Rapide
> **Q : Comment savoir si l'utilisateur est encore authentifié après un refresh de page ?**  
> **R :** Appelez `/auth/check` au chargement et mettez la réponse dans le contexte.

> **Q : Puis-je stocker le token dans Redux ?**  
> **R :** Inutile et déconseillé : le token est en HttpOnly.

> **Q : Comment réagir à un verrouillage de compte (⏰) ?**  
> **R :** Désactivez le formulaire et affichez un compte à rebours (`extractRemainingTime`).

> **Q : Les admin et les vendeurs utilisent-ils les mêmes endpoints ?**  
> **R :** Oui ; les autorisations sont gérées côté backend via le rôle dans le JWT.

---

> _Document à partager avec toute l'équipe Frontend._ 