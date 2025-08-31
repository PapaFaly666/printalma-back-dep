# 📝 Guide Frontend — Inscription Vendeur & Activation SuperAdmin (v2.2)

**Date :** 12 juin 2025  
**Version Backend API :** 2.2  
**Auteur :** Équipe Backend

---

## 1. 🧭 Vue d'ensemble
Ce document explique comment :
1. Afficher le formulaire d'inscription vendeur (_signup_).  
2. Appeler l'endpoint d'inscription et gérer les réponses.  
3. Informer l'utilisateur que son compte est **en attente d'activation** par le SuperAdmin.  
4. Gérer les tentatives de connexion tant que le compte n'est pas activé.

Le flux complet :
```
Utilisateur ➡️ POST /auth/register-vendeur ➡️ ✅ Compte créé (status=false) ➡️ ✉️ Email de notification ➡️ ⏳ Attente validation SuperAdmin ➡️ 🟢 Activation ➡️ 👤 Vendeur peut se connecter
```

---

## 2. 🔗 Endpoints Backend
| Méthode | Route | Auth ? | Description |
|---------|-------|--------|-------------|
| `POST` | `/auth/register-vendeur` | ❌ | Crée le compte vendeur (status = `false`). |
| `GET` | `/auth/activation-status/:email` | ❌ | Renvoie `{ activated: boolean }`. |
| `POST` | `/auth/login` | ❌ | Refusera la connexion (401) si `status = false`. |

> ⚠️ Tous les endpoints utilisent `application/json` et **ne nécessitent pas** de cookie tant que l'utilisateur n'est pas activé.

---

## 3. 📋 Payload d'Inscription
```jsonc
POST /auth/register-vendeur
{
  "email": "vendeur@example.com",      // Requis — valide & unique
  "password": "S3cureP@ss!",          // Requis — ≥ 8 car., 1 maj, 1 min, 1 chiffre, 1 spécial
  "firstName": "Jean",                // Requis
  "lastName": "Dupont",               // Requis
  "vendeur_type": "DESIGNER"          // Requis — DESIGNER | ARTISTE | INFLUENCEUR
}
```

### Réponse : Succès (201)
```jsonc
{
  "success": true,
  "message": "Votre compte a été créé. Il sera activé prochainement par le SuperAdmin."
}
```

### Réponses possibles d'erreur (4xx)
| Code | message | Raisons courantes |
|------|---------|-------------------|
| 400 | "Email déjà utilisé" | Email en double |
| 400 | "Mot de passe trop faible" | Regex non respectée |
| 422 | Validation error details | Champs manquants |

---

## 4. 🎨 Exemple de Formulaire React
```tsx
// src/pages/RegisterVendorPage.tsx
import { useState } from 'react';
import axios from 'axios';

export default function RegisterVendorPage() {
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    vendeur_type: 'DESIGNER'
  });
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR' | 'PENDING'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('PENDING');
    setError(null);
    try {
      const { data } = await axios.post(`${baseURL}/auth/register-vendeur`, form);
      if (data.success) setStatus('SUCCESS');
    } catch (err: any) {
      setStatus('ERROR');
      setError(err.response?.data?.message || 'Erreur inconnue');
    }
  };

  if (status === 'SUCCESS') {
    return (
      <div className="alert-success">
        <h2>🎉 Inscription réussie !</h2>
        <p>Votre compte est en attente d'activation par le SuperAdmin. Vous recevrez un email dès qu'il sera actif.</p>
        <p>En attendant, vous pouvez <a href="/login">revenir à la page de connexion</a>.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="register-form">
      {/* champs email, password, firstName, lastName, vendeur_type */}
      {error && <p className="error">{error}</p>}
      <button disabled={status === 'PENDING'}>
        {status === 'PENDING' ? 'En cours…' : 'Créer mon compte'}
      </button>
    </form>
  );
}
```

---

## 5. ⏳ Tentatives de Connexion avant Activation
Tant que `status = false`, un `POST /auth/login` renverra :
```jsonc
{
  "statusCode": 401,
  "message": "🕒 Votre compte est en attente d'activation par le SuperAdmin."
}
```

Le frontend doit :
1. Afficher ce message dans le composant d'erreur (cf. `FRONTEND_LOGIN_ERROR_HANDLING.md`).  
2. Proposer un lien « Renvoyer l'email d'activation » **optionnel** (endpoint futur : `/auth/resend-activation`).

---

## 6. 🔄 Vérification Périodique de l'Activation (optionnel)
Après l'inscription ou un échec de login pour compte inactif, vous pouvez proposer un bouton « Vérifier à nouveau » qui appelle :
```typescript
GET /auth/activation-status/:email → { activated: boolean }
```
Si `activated = true`, rediriger vers `/login` avec message « Votre compte est maintenant actif ».

---

## 7. ✉️ Email de Notification
Le backend envoie automatiquement un email au SuperAdmin et au vendeur :
* Vendeur : « Votre compte est créé et sera bientôt activé ».
* SuperAdmin : « Nouveau vendeur à activer ».

Aucune action frontend n'est requise pour l'envoi d'email, mais n'hésitez pas à rappeler à l'utilisateur de vérifier ses spams.

---

## 8. ✅ Checklist d'Intégration
- [ ] Valider tous les champs obligatoires côté client (regex email, force du mot de passe).  
- [ ] Afficher spinners et messages d'état (`PENDING` / `SUCCESS` / `ERROR`).  
- [ ] Gérer l'erreur 401 « compte en attente » dans le `LoginForm`.  
- [ ] (Optionnel) Mettre en place un polling ou un bouton pour vérifier l'activation.  
- [ ] Traduire les messages en français natif.

---
> _Document à partager avec toute l'équipe Frontend._ 