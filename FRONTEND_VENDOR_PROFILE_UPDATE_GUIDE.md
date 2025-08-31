# Guide Frontend : Modification du Profil Vendeur via `/auth/vendor/profile`

Ce guide explique comment permettre à un vendeur de modifier toutes ses informations de profil (prénom, nom, email, téléphone, pays, adresse, nom de la boutique, photo de profil) via l'API backend.

---

## 1. Champs modifiables
Le vendeur peut modifier les champs suivants :
- **Prénom** (`firstName`)
- **Nom** (`lastName`)
- **Email** (`email`)
- **Téléphone** (`phone`)
- **Pays** (`country`)
- **Adresse** (`address`)
- **Nom de la boutique** (`shop_name`)
- **Photo de profil** (`profilePhoto`)

---

## 2. Formulaire côté frontend
Crée un formulaire avec tous ces champs. Exemple minimal en React :

```jsx
<form onSubmit={handleSubmit} encType="multipart/form-data">
  <input name="firstName" value={values.firstName} onChange={handleChange} />
  <input name="lastName" value={values.lastName} onChange={handleChange} />
  <input name="email" value={values.email} onChange={handleChange} />
  <input name="phone" value={values.phone} onChange={handleChange} />
  <input name="country" value={values.country} onChange={handleChange} />
  <input name="address" value={values.address} onChange={handleChange} />
  <input name="shop_name" value={values.shop_name} onChange={handleChange} />
  <input type="file" name="profilePhoto" onChange={handleFileChange} />
  <button type="submit">Enregistrer</button>
</form>
```

---

## 3. Construction du payload
Utilise `FormData` pour envoyer les données (obligatoire si tu envoies une photo) :

```js
const formData = new FormData();
formData.append('firstName', values.firstName);
formData.append('lastName', values.lastName);
formData.append('email', values.email);
formData.append('phone', values.phone);
formData.append('country', values.country);
formData.append('address', values.address);
formData.append('shop_name', values.shop_name);
if (values.profilePhoto) {
  formData.append('profilePhoto', values.profilePhoto);
}
```

---

## 4. Appel API
Envoie la requête PUT :

```js
await fetch('/auth/vendor/profile', {
  method: 'PUT',
  headers: {
    // Pas besoin de Content-Type avec FormData
    'Authorization': `Bearer ${token}` // si besoin
  },
  body: formData
});
```

---

## 5. Gestion des réponses
- Si succès : affiche un message de confirmation et mets à jour le profil affiché.
- Si erreur (ex : email déjà utilisé) : affiche le message d'erreur.

---

## 6. Validation côté frontend (optionnel)
- Vérifie le format de l'email avant d'envoyer.
- Vérifie que les champs obligatoires ne sont pas vides.

---

## 7. Exemple de gestionnaire de soumission (React)

```js
const handleSubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  // ...ajoute tous les champs comme ci-dessus
  try {
    const res = await fetch('/auth/vendor/profile', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) throw new Error(await res.text());
    alert('Profil mis à jour !');
    // Mets à jour le state utilisateur ici
  } catch (err) {
    alert('Erreur : ' + err.message);
  }
};
```

---

## 8. Remarques
- L'API attend un `multipart/form-data`.
- Si tu ne modifies pas la photo, tu peux ne pas inclure `profilePhoto` dans le payload.
- L'email doit être unique (erreur si déjà utilisé).

---

**Pour toute question ou exemple détaillé (React, Vue, etc.), demande-le !** 

---

## 9. Changement sécurisé de l'adresse email du vendeur

Pour des raisons de sécurité, la modification de l'email doit suivre une procédure de validation :

1. **L'utilisateur saisit son mot de passe actuel** pour confirmer son identité.
2. **Il entre la nouvelle adresse email** souhaitée.
3. **Il clique sur “Envoyer le lien de confirmation”**.
4. Un email contenant un lien de validation est envoyé à la nouvelle adresse.
5. **L'utilisateur doit cliquer sur ce lien** pour finaliser la mise à jour de son email.
6. Tant que la confirmation n'est pas faite, l'ancienne adresse reste active.
7. Une notification est envoyée à l'ancienne adresse pour des raisons de sécurité.

### Exemple de formulaire (React)

```jsx
<form onSubmit={handleChangeEmail}>
  <input type="email" name="newEmail" placeholder="Nouvelle adresse email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
  <input type="password" name="currentPassword" placeholder="Mot de passe actuel" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
  <button type="submit">Envoyer le lien de confirmation</button>
</form>
```

### Exemple de gestionnaire (pseudo-code)

```js
const handleChangeEmail = async (e) => {
  e.preventDefault();
  const res = await fetch('/auth/vendor/request-email-change', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ newEmail, currentPassword })
  });
  if (res.ok) alert('Un email de confirmation a été envoyé à votre nouvelle adresse.');
  else alert('Erreur : ' + await res.text());
};
```

**Note :**
- Le backend doit gérer la génération du token de confirmation, l'envoi du mail, la validation du lien, et la notification à l'ancienne adresse.
- Tant que la confirmation n'est pas faite, l'email dans le profil reste inchangé. 