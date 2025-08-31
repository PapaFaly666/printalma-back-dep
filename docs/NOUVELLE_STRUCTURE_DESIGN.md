# Guide pour la nouvelle structure de design dans Printalma

## Changement important dans l'architecture

Afin de simplifier le système et d'éviter les problèmes de design null, nous avons modifié l'architecture du backend :

**Le design est maintenant directement intégré au produit, ce n'est plus une entité séparée.**

## Nouvelle structure du produit

Un produit inclut désormais directement les attributs suivants pour son design :

```json
{
  "name": "T-shirt cool",
  "description": "Un super t-shirt",
  "price": 19.99,
  "stock": 100,
  "categoryId": 1,
  "sizeIds": [1, 2, 3],
  
  // Attributs de design directement dans le produit
  "designName": "Design floral",
  "designDescription": "Un joli motif floral",
  "designImageUrl": "https://res.cloudinary.com/example/image/upload/v1620123456/designs/floral.jpg",
  
  // Autres attributs...
  "colors": [...]
}
```

## Comment envoyer un produit avec son design

### 1. Structure de la requête

Pour créer un produit avec son design, envoyez une requête `POST` à `/products` avec un `FormData` contenant :

- Un champ `product` qui est un objet JSON stringifié contenant les informations du produit
- Les fichiers images (design et couleurs) avec des noms correspondant à ceux définis dans votre JSON

### 2. Format du JSON à inclure dans le champ `product`

```javascript
{
  "name": "T-shirt cool",
  "description": "Un super t-shirt très confortable",
  "price": 19.99,
  "stock": 100,
  "sizeIds": [1, 2, 3],
  "categoryId": 1,
  "customDesign": {
    "name": "Mon design",       // Sera utilisé pour designName
    "description": "Super",     // Sera utilisé pour designDescription
    "image": "design.jpg"       // Nom du fichier à ajouter dans le FormData
  },
  "colors": [
    {
      "name": "Rouge", 
      "hex": "#FF0000",
      "image": "rouge.jpg"
    },
    {
      "name": "Bleu", 
      "hex": "#0000FF",
      "image": "bleu.jpg"
    }
  ]
}
```

### 3. Exemple complet en JavaScript

```javascript
// 1. Préparer les données du produit
const productData = {
  name: "T-shirt cool",
  description: "Un super t-shirt très confortable",
  price: 19.99,
  stock: 100,
  sizeIds: [1, 2, 3],
  categoryId: 1,
  customDesign: {
    name: "Mon design",
    description: "Superbe design",
    image: "design123.jpg"  // Nom du fichier
  },
  colors: [
    { name: "Rouge", hex: "#FF0000", image: "rouge123.jpg" },
    { name: "Bleu", hex: "#0000FF", image: "bleu123.jpg" }
  ]
};

// 2. Créer le FormData
const formData = new FormData();

// 3. Ajouter le JSON stringifié
formData.append('product', JSON.stringify(productData));

// 4. Ajouter l'image du design
formData.append('design123.jpg', designImageFile);

// 5. Ajouter les images des couleurs
formData.append('rouge123.jpg', redColorFile);
formData.append('bleu123.jpg', blueColorFile);

// 6. Envoyer la requête
const response = await fetch('/products', {
  method: 'POST',
  body: formData
});
```

## Points importants à comprendre

1. **Plus besoin de manipuler un designId** - Le design est créé automatiquement avec le produit
   
2. **Le design fait partie du produit** - Dans les réponses API, vous obtiendrez maintenant directement :
   ```json
   {
     "id": 1,
     "name": "T-shirt cool",
     "designName": "Mon design",
     "designDescription": "Superbe design",
     "designImageUrl": "https://res.cloudinary.com/...",
     // autres attributs...
   }
   ```

3. **Les champs du design** :
   - `designName` : Nom du design (obligatoire)
   - `designDescription` : Description du design (optionnel)
   - `designImageUrl` : URL de l'image du design sur Cloudinary (générée automatiquement)

4. **Le format `customDesign` dans la requête** est toujours utilisé pour plus de clarté et de cohérence avec le format des couleurs, mais les données sont directement enregistrées dans le produit.

## Avantages de cette nouvelle structure

- Simplification : plus besoin de gérer une entité Design séparée
- Performance : pas de jointures nécessaires pour récupérer les designs
- Fiabilité : un produit aura toujours ses attributs de design (même vides)
- Migration transparente : l'API reste compatible avec le code frontend existant

## Exemples supplémentaires

### Vérification du FormData avant envoi

```javascript
// Vérifier le contenu du FormData (pour débogage)
for (let pair of formData.entries()) {
  console.log(pair[0] + ': ' + pair[1]);
}
```

### Noms de fichiers uniques pour éviter les conflits

```javascript
const designFileName = `design_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
// Utiliser designFileName à la fois dans customDesign.image et comme clé dans formData.append()
```

## Besoin d'assistance ?

Si vous rencontrez des problèmes avec la nouvelle structure :

1. Vérifiez que les noms des fichiers dans le FormData correspondent exactement à ceux dans le JSON
2. Consultez les logs du serveur pour voir les détails du traitement
3. Assurez-vous que votre FormData contient bien le champ `product` avec un JSON valide 