# Guide – Publication d’un produit vendeur validé

Message d’erreur front :
```
PUT /vendor/products/:id/publish  ⇢ 404
```

## 1. Nouveau chemin (Architecture v2)
```
POST /vendor-product-validation/publish/{productId}
```

* Préfixe : `/vendor-product-validation`
* Méthode : **POST** (pas PUT)
* Auth : Bearer token du vendeur
* Paramètre URL : `productId` (ID du VendorProduct)

## 2. Exemple Axios
```ts
await axios.post(`/vendor-product-validation/publish/${productId}`, {}, {
  headers: { Authorization: `Bearer ${vendorToken}` }
});
```

## 3. Réponse attendue
```json
{
  "success": true,
  "message": "Produit publié avec succès",
  "newStatus": "PUBLISHED"
}
```

## 4. Conditions côté back
Le produit doit :
* appartenir au vendeur connecté ;
* avoir `status = DRAFT` ;
* être déjà validé par l’admin (`isValidated = true`).

Si l’une de ces conditions n’est pas remplie, le back renvoie **400**.

## 5. Checklist front
- [ ] Changer l’URL : `/vendor-product-validation/publish/{id}`.
- [ ] Vérifier que la méthode est **POST**.
- [ ] Afficher le bouton « Publier » uniquement si :
  * `status === 'DRAFT'`  **et**
  * `isValidated === true`.

---

Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Message d’erreur front :
```
PUT /vendor/products/:id/publish  ⇢ 404
```

## 1. Nouveau chemin (Architecture v2)
```
POST /vendor-product-validation/publish/{productId}
```

* Préfixe : `/vendor-product-validation`
* Méthode : **POST** (pas PUT)
* Auth : Bearer token du vendeur
* Paramètre URL : `productId` (ID du VendorProduct)

## 2. Exemple Axios
```ts
await axios.post(`/vendor-product-validation/publish/${productId}`, {}, {
  headers: { Authorization: `Bearer ${vendorToken}` }
});
```

## 3. Réponse attendue
```json
{
  "success": true,
  "message": "Produit publié avec succès",
  "newStatus": "PUBLISHED"
}
```

## 4. Conditions côté back
Le produit doit :
* appartenir au vendeur connecté ;
* avoir `status = DRAFT` ;
* être déjà validé par l’admin (`isValidated = true`).

Si l’une de ces conditions n’est pas remplie, le back renvoie **400**.

## 5. Checklist front
- [ ] Changer l’URL : `/vendor-product-validation/publish/{id}`.
- [ ] Vérifier que la méthode est **POST**.
- [ ] Afficher le bouton « Publier » uniquement si :
  * `status === 'DRAFT'`  **et**
  * `isValidated === true`.

---

Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Message d’erreur front :
```
PUT /vendor/products/:id/publish  ⇢ 404
```

## 1. Nouveau chemin (Architecture v2)
```
POST /vendor-product-validation/publish/{productId}
```

* Préfixe : `/vendor-product-validation`
* Méthode : **POST** (pas PUT)
* Auth : Bearer token du vendeur
* Paramètre URL : `productId` (ID du VendorProduct)

## 2. Exemple Axios
```ts
await axios.post(`/vendor-product-validation/publish/${productId}`, {}, {
  headers: { Authorization: `Bearer ${vendorToken}` }
});
```

## 3. Réponse attendue
```json
{
  "success": true,
  "message": "Produit publié avec succès",
  "newStatus": "PUBLISHED"
}
```

## 4. Conditions côté back
Le produit doit :
* appartenir au vendeur connecté ;
* avoir `status = DRAFT` ;
* être déjà validé par l’admin (`isValidated = true`).

Si l’une de ces conditions n’est pas remplie, le back renvoie **400**.

## 5. Checklist front
- [ ] Changer l’URL : `/vendor-product-validation/publish/{id}`.
- [ ] Vérifier que la méthode est **POST**.
- [ ] Afficher le bouton « Publier » uniquement si :
  * `status === 'DRAFT'`  **et**
  * `isValidated === true`.

---

Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Message d’erreur front :
```
PUT /vendor/products/:id/publish  ⇢ 404
```

## 1. Nouveau chemin (Architecture v2)
```
POST /vendor-product-validation/publish/{productId}
```

* Préfixe : `/vendor-product-validation`
* Méthode : **POST** (pas PUT)
* Auth : Bearer token du vendeur
* Paramètre URL : `productId` (ID du VendorProduct)

## 2. Exemple Axios
```ts
await axios.post(`/vendor-product-validation/publish/${productId}`, {}, {
  headers: { Authorization: `Bearer ${vendorToken}` }
});
```

## 3. Réponse attendue
```json
{
  "success": true,
  "message": "Produit publié avec succès",
  "newStatus": "PUBLISHED"
}
```

## 4. Conditions côté back
Le produit doit :
* appartenir au vendeur connecté ;
* avoir `status = DRAFT` ;
* être déjà validé par l’admin (`isValidated = true`).

Si l’une de ces conditions n’est pas remplie, le back renvoie **400**.

## 5. Checklist front
- [ ] Changer l’URL : `/vendor-product-validation/publish/{id}`.
- [ ] Vérifier que la méthode est **POST**.
- [ ] Afficher le bouton « Publier » uniquement si :
  * `status === 'DRAFT'`  **et**
  * `isValidated === true`.

---

Dernière mise à jour : 2025-07-05 
 
 
 
 
 