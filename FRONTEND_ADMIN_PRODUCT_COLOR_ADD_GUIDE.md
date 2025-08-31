# Guide Frontend : Ajout d’une Couleur et Image pour Produit Admin (Mockup)

Ce guide explique comment ajouter une nouvelle couleur à un produit admin et uploader une image pour cette couleur **sans jamais utiliser d’ID temporaire**.

---

## 1. Problème classique
- Si tu ajoutes une nouvelle couleur côté frontend et que tu lui attribues un ID temporaire (ex : `Date.now()`), tu risques d’avoir une erreur INT4 côté backend lors de l’upload d’image.
- **Il ne faut jamais utiliser d’ID temporaire pour une nouvelle couleur ou image dans les requêtes backend.**

---

## 2. Workflow correct

1. **Ajoute la nouvelle couleur sans image** dans le PATCH de modification du produit :
   ```js
   await updateProduct(productId, {
     ...autresChamps,
     colorVariations: [
       ...anciennesCouleurs,
       { name: 'Nouvelle couleur', colorCode: '#xxxxxx', images: [], delimitations: [] }
     ]
   });
   ```
2. **Recharge le produit** depuis le backend pour obtenir l’ID réel de la nouvelle couleur :
   ```js
   const product = await getProduct(productId);
   const newColor = product.colorVariations.find(c => c.name === 'Nouvelle couleur');
   ```
3. **Upload l’image** pour cette couleur avec le vrai ID :
   ```js
   await uploadColorImage(productId, newColor.id, file);
   ```
4. **Ajoute l’image** dans le state (sans id), puis PATCH à nouveau si besoin.

---

## 3. Pièges à éviter
- **Ne jamais utiliser d’ID temporaire** (ex : `Date.now()`, string, nombre trop grand) pour une nouvelle couleur ou image dans le payload ou l’upload.
- **Toujours attendre l’ID réel** généré par la base avant d’uploader une image pour une nouvelle couleur.

---

## 4. Exemple de code

```js
// 1. PATCH pour ajouter la nouvelle couleur (sans image)
await updateProduct(productId, {
  ...autresChamps,
  colorVariations: [
    ...anciennesCouleurs,
    { name: 'Rouge', colorCode: '#f60404', images: [], delimitations: [] }
  ]
});

// 2. Recharge le produit pour obtenir l’ID réel de la nouvelle couleur
const product = await getProduct(productId);
const newColor = product.colorVariations.find(c => c.name === 'Rouge');

// 3. Upload l’image avec le vrai ID
await uploadColorImage(productId, newColor.id, file);
```

---

## 5. Résumé
- **Jamais d’ID temporaire** pour les nouveaux éléments
- **Toujours attendre l’ID réel** avant d’uploader une image pour une nouvelle couleur
- **Workflow** : PATCH (ajout couleur) → GET (récupère l’ID) → upload image

---

**Pour toute question ou exemple détaillé, demande-le !** 
 