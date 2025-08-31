# Guide Frontend : Gestion des IDs lors de la Modification d’un Produit Admin

Ce guide explique comment gérer correctement les IDs lors de la modification d’un produit admin (mockup), notamment pour l’ajout de nouvelles couleurs ou images, afin d’éviter les erreurs d’ID temporaire (INT trop grand) lors de l’upload d’image.

---

## 1. Problème classique
- Quand tu ajoutes une nouvelle couleur ou image côté frontend, tu peux être tenté de générer un ID temporaire (ex : `Date.now()` ou un grand nombre).
- Si tu utilises cet ID temporaire pour uploader une image ou modifier un élément, le backend va échouer (erreur INT4 ou "not found").

---

## 2. Règle d’or
- **N’utilise jamais d’ID temporaire pour les nouveaux éléments lors des requêtes vers le backend.**
- **N’upload jamais d’image pour une couleur qui n’a pas encore d’ID réel (généré par la base).**

---

## 3. Workflow correct pour ajouter une couleur + image

1. **Ajoute la nouvelle couleur sans image** dans le payload de modification du produit :
   ```js
   await updateProduct(productId, {
     ...autresChamps,
     colorVariations: [
       ...anciennesCouleurs,
       { name: 'Nouvelle couleur', images: [], delimitations: [] }
     ]
   });
   ```
2. **Récupère le produit modifié** et l’ID réel de la nouvelle couleur :
   ```js
   const product = await getProduct(productId);
   const newColor = product.colorVariations.find(c => c.name === 'Nouvelle couleur');
   ```
3. **Upload l’image** avec le vrai `colorId` :
   ```js
   await uploadColorImage(productId, newColor.id, file);
   ```
4. **Ajoute l’image** dans le payload de modification lors du prochain PATCH.

---

## 4. Pièges à éviter
- Ne jamais envoyer d’ID généré côté frontend pour un nouvel élément.
- Ne pas essayer d’uploader une image tant que la couleur n’a pas d’ID réel.
- Toujours attendre la réponse du backend pour obtenir les vrais IDs.

---

## 5. Exemple de code complet

```js
// Ajout d’une nouvelle couleur puis upload d’image
await updateProduct(productId, {
  ...autresChamps,
  colorVariations: [
    ...anciennesCouleurs,
    { name: 'Rouge', images: [], delimitations: [] }
  ]
});
const product = await getProduct(productId);
const newColor = product.colorVariations.find(c => c.name === 'Rouge');
await uploadColorImage(productId, newColor.id, file);
```

---

## 6. Résumé
- **Toujours utiliser les IDs du backend** pour toute opération (modification, upload, suppression)
- **Ne jamais utiliser d’ID temporaire** dans les requêtes
- **Workflow** : crée d’abord l’élément → récupère l’ID → upload ou modifie

---

**Pour toute question ou exemple détaillé, demande-le !** 
 