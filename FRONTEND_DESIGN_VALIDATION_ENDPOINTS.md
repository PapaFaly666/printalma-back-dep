# Guide rapide – Endpoint de validation d’un design

Erreur observée côté front :
```
POST http://localhost:3004/designs/18/validate  ➜ 404
```

Cause : URL incorrecte. Depuis la v2 de l’API, tous les chemins sont préfixés par `/api/designs`.

## 1. Endpoint correct
```
PUT /api/designs/{id}/validate
```
Exemple :
```
PUT http://localhost:3004/api/designs/18/validate
```

## 2. Corps de la requête
```json
{
  "action": "VALIDATE"          // ou "REJECT"
  // "rejectionReason": "…"    // requis si action = REJECT
}
```

## 3. Exemple Axios
```ts
await axios.put(`/api/designs/${id}/validate`, {
  action: 'VALIDATE'
}, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

## 4. Rappel des réponses
Succès :
```json
{
  "success": true,
  "message": "Design validé avec succès",
  "data": { /* objet Design complet */ }
}
```
Erreur possible :
* **400** – action manquante ou `rejectionReason` absent lorsque `action = REJECT`.
* **403** – token admin requis.
* **404** – design inexistant ou mauvaise URL (souvent oubli de `/api`).

## 5. Checklist front
- [ ] Vérifier le préfixe `/api/designs` dans la fonction `validateDesign` du `designService`.
- [ ] S'assurer que la méthode est **PUT** (et non POST).
- [ ] Envoyer `action` en majuscules (`VALIDATE` ou `REJECT`).
- [ ] Ajouter `rejectionReason` uniquement si REJECT.

---

Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Erreur observée côté front :
```
POST http://localhost:3004/designs/18/validate  ➜ 404
```

Cause : URL incorrecte. Depuis la v2 de l’API, tous les chemins sont préfixés par `/api/designs`.

## 1. Endpoint correct
```
PUT /api/designs/{id}/validate
```
Exemple :
```
PUT http://localhost:3004/api/designs/18/validate
```

## 2. Corps de la requête
```json
{
  "action": "VALIDATE"          // ou "REJECT"
  // "rejectionReason": "…"    // requis si action = REJECT
}
```

## 3. Exemple Axios
```ts
await axios.put(`/api/designs/${id}/validate`, {
  action: 'VALIDATE'
}, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

## 4. Rappel des réponses
Succès :
```json
{
  "success": true,
  "message": "Design validé avec succès",
  "data": { /* objet Design complet */ }
}
```
Erreur possible :
* **400** – action manquante ou `rejectionReason` absent lorsque `action = REJECT`.
* **403** – token admin requis.
* **404** – design inexistant ou mauvaise URL (souvent oubli de `/api`).

## 5. Checklist front
- [ ] Vérifier le préfixe `/api/designs` dans la fonction `validateDesign` du `designService`.
- [ ] S'assurer que la méthode est **PUT** (et non POST).
- [ ] Envoyer `action` en majuscules (`VALIDATE` ou `REJECT`).
- [ ] Ajouter `rejectionReason` uniquement si REJECT.

---

Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Erreur observée côté front :
```
POST http://localhost:3004/designs/18/validate  ➜ 404
```

Cause : URL incorrecte. Depuis la v2 de l’API, tous les chemins sont préfixés par `/api/designs`.

## 1. Endpoint correct
```
PUT /api/designs/{id}/validate
```
Exemple :
```
PUT http://localhost:3004/api/designs/18/validate
```

## 2. Corps de la requête
```json
{
  "action": "VALIDATE"          // ou "REJECT"
  // "rejectionReason": "…"    // requis si action = REJECT
}
```

## 3. Exemple Axios
```ts
await axios.put(`/api/designs/${id}/validate`, {
  action: 'VALIDATE'
}, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

## 4. Rappel des réponses
Succès :
```json
{
  "success": true,
  "message": "Design validé avec succès",
  "data": { /* objet Design complet */ }
}
```
Erreur possible :
* **400** – action manquante ou `rejectionReason` absent lorsque `action = REJECT`.
* **403** – token admin requis.
* **404** – design inexistant ou mauvaise URL (souvent oubli de `/api`).

## 5. Checklist front
- [ ] Vérifier le préfixe `/api/designs` dans la fonction `validateDesign` du `designService`.
- [ ] S'assurer que la méthode est **PUT** (et non POST).
- [ ] Envoyer `action` en majuscules (`VALIDATE` ou `REJECT`).
- [ ] Ajouter `rejectionReason` uniquement si REJECT.

---

Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Erreur observée côté front :
```
POST http://localhost:3004/designs/18/validate  ➜ 404
```

Cause : URL incorrecte. Depuis la v2 de l’API, tous les chemins sont préfixés par `/api/designs`.

## 1. Endpoint correct
```
PUT /api/designs/{id}/validate
```
Exemple :
```
PUT http://localhost:3004/api/designs/18/validate
```

## 2. Corps de la requête
```json
{
  "action": "VALIDATE"          // ou "REJECT"
  // "rejectionReason": "…"    // requis si action = REJECT
}
```

## 3. Exemple Axios
```ts
await axios.put(`/api/designs/${id}/validate`, {
  action: 'VALIDATE'
}, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

## 4. Rappel des réponses
Succès :
```json
{
  "success": true,
  "message": "Design validé avec succès",
  "data": { /* objet Design complet */ }
}
```
Erreur possible :
* **400** – action manquante ou `rejectionReason` absent lorsque `action = REJECT`.
* **403** – token admin requis.
* **404** – design inexistant ou mauvaise URL (souvent oubli de `/api`).

## 5. Checklist front
- [ ] Vérifier le préfixe `/api/designs` dans la fonction `validateDesign` du `designService`.
- [ ] S'assurer que la méthode est **PUT** (et non POST).
- [ ] Envoyer `action` en majuscules (`VALIDATE` ou `REJECT`).
- [ ] Ajouter `rejectionReason` uniquement si REJECT.

---

Dernière mise à jour : 2025-07-05 
 
 
 
 
 