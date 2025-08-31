# Guide Frontend : Page de confirmation de changement d'email

Ce guide explique comment implémenter la page `/confirm-email-change` côté frontend pour permettre à l'utilisateur de valider son changement d'email via le lien reçu par email.

---

## 1. Objectif
- Permettre à l'utilisateur de cliquer sur le lien de confirmation reçu par email.
- Valider le token auprès du backend.
- Afficher un message de succès ou d'erreur.

---

## 2. Flux utilisateur
1. L'utilisateur clique sur le lien reçu par email :
   `https://votre-frontend.com/confirm-email-change?token=...`
2. Le frontend récupère le token dans l'URL.
3. Le frontend appelle l'API backend :
   `GET /auth/vendor/confirm-email-change?token=...`
4. Le backend valide le token et répond avec un message de succès ou d'erreur.
5. Le frontend affiche le message à l'utilisateur.

---

## 3. Exemple d'implémentation (React)

### a) Créer la page `ConfirmEmailChange.jsx`
```jsx
import React, { useEffect, useState } from 'react';

export default function ConfirmEmailChange() {
  const [message, setMessage] = useState('Validation en cours...');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setMessage('Lien invalide.');
      return;
    }
    fetch(`/auth/vendor/confirm-email-change?token=${token}`)
      .then(async res => {
        const data = await res.json();
        if (res.ok) setMessage(data.message || 'Votre adresse email a été mise à jour.');
        else setMessage(data.message || 'Erreur lors de la validation du lien.');
      })
      .catch(() => setMessage('Erreur réseau.'));
  }, []);
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', marginTop: 60 }}>
      <h2>Confirmation de l’email</h2>
      <p>{message}</p>
    </div>
  );
}
```

### b) Ajouter la route dans le routeur (React Router)
```jsx
<Route path="/confirm-email-change" element={<ConfirmEmailChange />} />
```

---

## 4. Bonnes pratiques
- Afficher un message d’attente pendant la validation.
- Gérer les cas d’erreur (lien invalide, expiré, erreur réseau).
- Ne pas afficher d’informations sensibles.
- Rediriger l’utilisateur vers la page de login ou de profil après quelques secondes si besoin.

---

## 5. Autres frameworks
- **Vue.js** : Utilise `onMounted` et `this.$route.query.token` pour récupérer le token et faire l’appel API.
- **Angular** : Utilise `ActivatedRoute` pour lire le paramètre et `HttpClient` pour l’appel API.

---

**Pour toute question ou exemple détaillé, demande-le !** 