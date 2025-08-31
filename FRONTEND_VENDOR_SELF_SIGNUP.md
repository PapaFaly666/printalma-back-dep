# 🛠️ Guide Frontend — Auto-inscription Vendeur (v2.2)

**Date :** 12 juin 2025  
**Auteur :** Équipe Backend

Ce document explique comment intégrer le nouvel endpoint public `/auth/register-vendeur` dans votre application React / Vue / Angular afin que les vendeurs puissent créer leur compte sans intervention d'un administrateur.

---

## 1. Rappel Backend
| Méthode | Route | Auth requise | Description |
|---------|-------|--------------|-------------|
| `POST` | `/auth/register-vendeur` | Aucune | Crée un compte vendeur inactif (`status=false`). |
| `GET` | `/auth/activation-status/:email` | Aucune | Retourne `{ activated: boolean }`. |

---

## 2. Payload attendu
```ts
interface RegisterVendorPayload {
  email: string;                     // Format email valide
  password: string;                  // ≥ 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial
  firstName: string;                 // Non vide
  lastName: string;                  // Non vide
  vendeur_type: 'DESIGNER' | 'ARTISTE' | 'INFLUENCEUR';
}
```

> ⚠️ Tous les champs sont **obligatoires**.

---

## 3. Service d'auth (Axios)
```ts
// src/services/authService.ts
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3004',
  timeout: 10000,
});

export async function registerVendor(payload: RegisterVendorPayload) {
  try {
    const { data } = await API.post('/auth/register-vendeur', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return { ok: true, message: data.message };
  } catch (err: any) {
    const msg = err.response?.data?.message ?? 'Erreur inconnue';
    return { ok: false, message: msg };
  }
}

export async function checkActivation(email: string) {
  const { data } = await API.get(`/auth/activation-status/${encodeURIComponent(email)}`);
  return data.activated as boolean;
}
```

---

## 4. Formulaire React minimal
```tsx
// src/pages/RegisterVendorPage.tsx
import { useState } from 'react';
import { registerVendor } from '../services/authService';

export default function RegisterVendorPage() {
  const [form, setForm] = useState<RegisterVendorPayload>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    vendeur_type: 'DESIGNER',
  });
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR' | 'PENDING'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('PENDING');
    const res = await registerVendor(form);
    if (res.ok) setStatus('SUCCESS');
    else {
      setError(res.message);
      setStatus('ERROR');
    }
  };

  if (status === 'SUCCESS') {
    return (
      <div className="alert-success">
        <h2>🎉 Inscription réussie !</h2>
        <p>Votre compte est en attente d'activation par le SuperAdmin.</p>
        <p>Vous serez notifié par email dès qu'il sera actif.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="register-form">
      {/* --- Champs prénom, nom, email, password --- */}
      <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Prénom" required />
      <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Nom" required />
      <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
      <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Mot de passe" required />
      <select name="vendeur_type" value={form.vendeur_type} onChange={handleChange}>
        <option value="DESIGNER">Designer</option>
        <option value="ARTISTE">Artiste</option>
        <option value="INFLUENCEUR">Influenceur</option>
      </select>

      {error && <p className="error">{error}</p>}
      <button disabled={status === 'PENDING'}>{status === 'PENDING' ? 'En cours…' : 'Créer mon compte'}</button>
    </form>
  );
}
```

---

## 5. Gestion des erreurs
| Message backend | Affichage recommandé |
|-----------------|----------------------|
| `Email déjà utilisé` | ❌ Email en rouge, texte d'erreur. |
| `Mot de passe trop faible` | ❌ Afficher règles de complexité. |
| `Tous les champs sont requis` | ❌ Vérifier que le formulaire est complet. |

Lors d'un 400, utilisez `err.response.data.message` pour faire remonter l'erreur exacte.

---

## 6. Vérifier l'activation manuellement
Ajouter un bouton "Vérifier activation" :
```tsx
const handleCheck = async () => {
  const activated = await checkActivation(form.email);
  if (activated) window.location.href = '/login?justActivated=1';
  else alert('Toujours en attente d\'activation');
};
```

---

## 7. UX recommandée
1. Après inscription ➜ page « En attente d'activation » + lien retour login.  
2. Tant que `/auth/login` renvoie 401 « en attente d'activation », afficher message `ACCOUNT_PENDING`.  
3. Optional : proposer `handleCheck` pour re-vérifier l'activation.

---

## 8. Tests rapides (cURL)
```bash
# Inscription
curl -X POST http://localhost:3004/auth/register-vendeur \
  -H 'Content-Type: application/json' \
  -d '{"email":"vendor@test.com","password":"Azerty12$","firstName":"Test","lastName":"User","vendeur_type":"DESIGNER"}'

# Vérification activation
curl http://localhost:3004/auth/activation-status/vendor@test.com
```

---

> _Partagez ce guide avec toute l'équipe Frontend._ 