# 📦 API Création de Produit avec Design & Couleurs

**Endpoint**  
`POST /products`  
**Content-Type** : `multipart/form-data`

---

## 1. Structure du FormData

- **Champ `product`** :  
  Un string JSON qui contient toutes les infos du produit, du design, et des couleurs.
- **Images** :  
  Chaque image (design, couleur) doit être ajoutée dans le FormData avec un nom unique, qui sera référencé dans le JSON.
- **Stockage Cloudinary** :  
  Toutes les images sont automatiquement uploadées sur Cloudinary et leurs URLs sont stockées en base de données.

---

### Exemple de JSON à mettre dans le champ `product` :

```json
{
  "name": "T-shirt cool",
  "description": "Un super t-shirt très confortable",
  "price": 19.99,
  "stock": 100,
  "sizeIds": [1, 2, 3],
  "categoryId": 1,
  "customDesign": {
    "name": "Mon design",
    "description": "Super design",
    "image": "design.jpg"           // <--- ce nom DOIT correspondre au nom du fichier dans le FormData
  },
  "colors": [
    {
      "name": "Rouge",
      "hex": "#FF0000",
      "image": "couleur_rouge.jpg"  // <--- ce nom DOIT correspondre au nom du fichier dans le FormData
    },
    {
      "name": "Bleu",
      "hex": "#0000FF",
      "image": "couleur_bleu.jpg"   // <--- ce nom DOIT correspondre au nom du fichier dans le FormData
    }
  ]
}
```

⚠️ **IMPORTANT**: Le nom dans le champ `image` (ex: `"couleur_rouge.jpg"`) doit être **EXACTEMENT** le même que le nom du fichier dans le FormData.

---

### Exemple d'envoi avec `curl` :

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: multipart/form-data" \
  -F 'product={
    "name": "T-shirt cool",
    "description": "Un super t-shirt très confortable",
    "price": 19.99,
    "stock": 100,
    "sizeIds": [1, 2, 3],
    "categoryId": 1,
    "customDesign": {
      "name": "Mon design",
      "description": "Super design",
      "image": "design.jpg"
    },
    "colors": [
      {
        "name": "Rouge",
        "hex": "#FF0000",
        "image": "couleur_rouge.jpg"
      },
      {
        "name": "Bleu",
        "hex": "#0000FF",
        "image": "couleur_bleu.jpg"
      }
    ]
  }' \
  -F "design.jpg=@/chemin/vers/design.jpg" \
  -F "couleur_rouge.jpg=@/chemin/vers/rouge.jpg" \
  -F "couleur_bleu.jpg=@/chemin/vers/bleu.jpg"
```

---

## 2. Règles importantes

- **Le champ `product` doit être un JSON stringifié** (utiliser `JSON.stringify` côté front).
- **Le nom de chaque image dans le FormData doit correspondre EXACTEMENT à la propriété `image` dans le JSON** (ex : `"image": "couleur_rouge.jpg"` → champ FormData `couleur_rouge.jpg`).
- **Tu peux ajouter autant de couleurs que tu veux** dans le tableau `colors`.
- **Le design est optionnel** : si tu ne veux pas de design, omets le champ `customDesign`.
- **Chaque image est uploadée sur Cloudinary** et l'URL est stockée en base de données.

---

## 3. Exemple en JavaScript (front)

```js
const formData = new FormData();

// Étape 1: Préparer l'objet produit avec les noms des fichiers
const product = {
  name: 'T-shirt cool',
  description: 'Un super t-shirt très confortable',
  price: 19.99,
  stock: 100,
  sizeIds: [1, 2, 3],
  categoryId: 1,
  customDesign: {
    name: 'Mon design',
    description: 'Super design',
    image: 'design.jpg'  // Ce nom doit correspondre au nom du fichier dans le FormData
  },
  colors: [
    { 
      name: 'Rouge', 
      hex: '#FF0000', 
      image: 'color_1.jpg'  // Ce nom doit correspondre au nom du fichier dans le FormData
    },
    { 
      name: 'Bleu', 
      hex: '#0000FF', 
      image: 'color_2.jpg'  // Ce nom doit correspondre au nom du fichier dans le FormData
    }
  ]
};

// Étape 2: Ajouter le JSON stringifié au FormData
formData.append('product', JSON.stringify(product));

// Étape 3: Ajouter les images avec les MÊMES noms que dans le JSON
formData.append('design.jpg', fileDesign);
formData.append('color_1.jpg', fileRouge);
formData.append('color_2.jpg', fileBleu);

// Étape 4: Envoyer la requête
fetch('/products', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Produit créé avec succès:', data);
  // data contiendra les URLs Cloudinary des images uploadées
})
.catch(error => console.error('Erreur:', error));
```

---

## 4. Réponse attendue

- Un objet JSON contenant le produit créé, avec toutes ses couleurs et son design associés.
- Chaque couleur aura un champ `imageUrl` contenant l'URL Cloudinary de l'image uploadée.
- Le design aura un champ `imageUrl` contenant l'URL Cloudinary de l'image uploadée.

---

## 5. Erreurs possibles

- **400** : Le champ `product` est manquant ou n'est pas un JSON valide.
- **400** : Un champ image référencé dans le JSON n'est pas présent dans le FormData.
- **422** : Un champ obligatoire du produit est manquant dans le JSON.

---

## 6. Dépannage

Si les images ne sont pas uploadées sur Cloudinary (URL = "https://placeholder.com/100x100"):
1. Vérifiez que le nom dans le JSON (`"image": "color_1.jpg"`) correspond EXACTEMENT au nom du fichier dans le FormData.
2. Vérifiez que vous affichez les logs de la réponse complète du serveur pour voir s'il y a des erreurs.
3. Assurez-vous que les fichiers sont bien des images valides (JPEG, PNG, etc.).

---

## 7. Résumé

- **Tout est dans un seul POST** : infos produit (JSON) + images (fichiers).
- **Correspondance par nom EXACTE** entre le JSON et les fichiers.
- **Toutes les images sont uploadées sur Cloudinary automatiquement.**
- **Aucune limite** sur le nombre de couleurs.

---

**Si besoin d'un exemple React, Vue, Angular ou d'un test Postman, demande-le !** 