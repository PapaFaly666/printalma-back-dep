# Guide API : Changement sécurisé de l'adresse email vendeur

Ce guide explique comment le frontend doit intégrer le système de changement d'email sécurisé pour les vendeurs.

---

## 1. Fonctionnalité
Le vendeur peut demander à changer son adresse email. Pour des raisons de sécurité :
- Il doit saisir son mot de passe actuel.
- Il reçoit un lien de confirmation sur la nouvelle adresse.
- L'email n'est changé qu'après validation du lien.
- Une notification est envoyée à l'ancienne adresse.

---

## 2. Endpoints Backend

### a) Demander un changement d'email
- **Méthode :** `POST`
- **URL :** `/auth/vendor/request-email-change`
- **Headers :**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Body :**
```json
{
  "newEmail": "nouvelle@email.com",
  "currentPassword": "motdepasseactuel"
}
```
- **Réponse (succès) :**
```json
{
  "success": true,
  "message": "Un email de confirmation a été envoyé à la nouvelle adresse."
}
```
- **Réponse (erreur) :**
  - 400 : Email déjà utilisé, identique à l'actuel, ou format invalide
  - 401 : Mot de passe incorrect

### b) Confirmer le changement d'email
- **Méthode :** `GET`
- **URL :** `/auth/vendor/confirm-email-change?token=...`
- **Réponse (succès) :**
```json
{
  "success": true,
  "message": "Votre adresse email a été mise à jour."
}
```
- **Réponse (erreur) :**
  - 400 : Lien invalide ou expiré

---

## 3. Flux utilisateur côté frontend

1. L'utilisateur ouvre le formulaire de changement d'email.
2. Il saisit sa nouvelle adresse email et son mot de passe actuel.
3. Il clique sur "Envoyer le lien de confirmation".
4. Un message de succès s'affiche si la requête est acceptée.
5. Il reçoit un email sur la nouvelle adresse avec un lien de confirmation.
6. Il clique sur le lien → l'API valide le token et met à jour l'email.
7. Un message de succès s'affiche (dans le frontend ou sur une page dédiée).
8. L'ancienne adresse reçoit une notification de sécurité.

---

## 4. Exemple d'intégration (React)

```jsx
<form onSubmit={handleChangeEmail}>
  <input type="email" name="newEmail" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
  <input type="password" name="currentPassword" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
  <button type="submit">Envoyer le lien de confirmation</button>
</form>
```

```js
const handleChangeEmail = async (e) => {
  e.preventDefault();
  const res = await fetch('/auth/vendor/request-email-change', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ newEmail, currentPassword })
  });
  if (res.ok) alert('Un email de confirmation a été envoyé à votre nouvelle adresse.');
  else alert('Erreur : ' + await res.text());
};
```

---

## 5. Bonnes pratiques
- Afficher un message clair après la demande (succès ou erreur).
- Ne pas changer l'email affiché dans le profil tant que la confirmation n'est pas faite.
- Prévoir une page ou un message pour la validation du lien (succès/échec).
- Gérer les cas d'erreur (mot de passe incorrect, email déjà utilisé, lien expiré).

---

**Pour toute question ou exemple détaillé, demande-le !** 