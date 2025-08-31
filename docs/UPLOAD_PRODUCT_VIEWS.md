# 📸 Documentation Complète : Upload des vues (views) produit

## Objectif
Permettre au frontend d'ajouter plusieurs vues (images) à un produit lors de sa création, chaque vue correspondant à un angle ou un détail du produit.

---

## 1. Structure du JSON attendu (`product`)

Le champ `views` est un tableau d'objets, chaque objet représentant une vue du produit :

```json
{
  "name": "T-shirt personnalisé",
  "description": "Un super t-shirt avec plusieurs vues",
  "price": 25,
  "stock": 10,
  "categoryId": 1,
  "sizeIds": [1,2],
  "customDesign": { ... },
  "views": [
    { "viewType": "FRONT", "image": "front.jpg", "description": "Vue de face" },
    { "viewType": "BACK", "image": "back.jpg", "description": "Vue de dos" },
    { "viewType": "LEFT", "image": "left.jpg" }
  ]
}
```
- **viewType** (obligatoire) : Type de vue (`FRONT`, `BACK`, `LEFT`, `RIGHT`, `TOP`, `BOTTOM`, `DETAIL`, `OTHER`)
- **image** (obligatoire) : Nom du fichier image envoyé dans le form-data
- **description** (optionnel) : Description de la vue

---

## 2. Envoi des fichiers (multipart/form-data)

- Le champ `product` doit contenir le JSON ci-dessus (sous forme de string).
- Les fichiers images doivent être ajoutés dans le form-data, avec le même nom que dans le champ `image` de chaque vue.

**Exemple de form-data :**

| Clé        | Valeur (type)                |
|------------|-----------------------------|
| product    | (string, voir ci-dessus)     |
| front.jpg  | (fichier image)              |
| back.jpg   | (fichier image)              |
| left.jpg   | (fichier image)              |

---

## 3. Exemple d'intégration avec fetch (JS)

```js
const formData = new FormData();
formData.append('product', JSON.stringify({
  name: 'T-shirt personnalisé',
  description: 'Un super t-shirt avec plusieurs vues',
  price: 25,
  stock: 10,
  categoryId: 1,
  sizeIds: [1,2],
  customDesign: { /* ... */ },
  views: [
    { viewType: 'FRONT', image: 'front.jpg', description: 'Vue de face' },
    { viewType: 'BACK', image: 'back.jpg', description: 'Vue de dos' }
  ]
}));
formData.append('front.jpg', fileFront); // fileFront = File JS
formData.append('back.jpg', fileBack);   // fileBack = File JS

fetch('http://localhost:3004/products', {
  method: 'POST',
  body: formData
});
```

---

## 4. Types de vues disponibles

- `FRONT` : Vue de face
- `BACK` : Vue de dos
- `LEFT` : Vue de gauche
- `RIGHT` : Vue de droite
- `TOP` : Vue du dessus
- `BOTTOM` : Vue du dessous
- `DETAIL` : Vue détaillée
- `OTHER` : Autre

---

## 5. Bonnes pratiques & conseils

- **Correspondance des noms** : Le nom du fichier dans le form-data doit être identique à la valeur du champ `image` dans chaque objet `views`.
- **Images manquantes** : Si une image n'est pas trouvée dans le form-data, la vue sera créée sans image (`imageUrl = null`).
- **Descriptions** : Utilisez le champ `description` pour donner des précisions utiles à l'utilisateur final (ex : "Zoom sur le logo").
- **Types de vues** : Respectez les valeurs de `viewType` pour une meilleure organisation côté back et front.
- **Validation** : Vérifiez côté front que chaque vue a bien un type et un nom d'image cohérent.

---

## 6. Gestion des erreurs fréquentes

- **400 Bad Request** :  
  - Vérifiez que le champ `product` est bien présent et contient un JSON valide.
  - Vérifiez que `categoryId` correspond à une catégorie existante.
  - Vérifiez que chaque vue a bien un `viewType` valide et un nom d'image cohérent avec le form-data.
- **Image non uploadée** :  
  - Si le nom de l'image dans le JSON ne correspond à aucun fichier dans le form-data, la vue sera créée sans image.

---

## 7. Exemple de réponse backend

En cas de succès, le backend retourne le produit créé (sans les images uploadées des vues, sauf si tu demandes un retour enrichi) :

```json
{
  "id": 42,
  "name": "T-shirt personnalisé",
  "description": "...",
  "views": [
    {
      "id": 1,
      "viewType": "FRONT",
      "imageUrl": "https://res.cloudinary.com/xxx/front.jpg",
      "description": "Vue de face"
    },
    ...
  ],
  ...
}
```
> Si tu veux que la réponse contienne systématiquement les vues créées, demande-le au backend.

---

## 8. Contact & support

- **Problème d'intégration ?**  
  Vérifie la console du navigateur et les logs backend pour plus de détails.
- **Besoin d'un exemple spécifique ou d'un retour enrichi ?**  
  Contacte l'équipe backend.

---

**Contactez le backend si vous avez besoin d'autres exemples ou d'un retour spécifique dans la réponse !** 