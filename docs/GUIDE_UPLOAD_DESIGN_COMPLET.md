# Guide définitif pour l'upload de designs avec produits

## ⚠️ IMPORTANT: L'objet `customDesign` est OBLIGATOIRE

Pour que l'image de design soit correctement uploadée sur Cloudinary, **vous devez obligatoirement inclure l'objet `customDesign` dans votre JSON** avec le nom du fichier dans la propriété `image`.

## Structure exacte requise

```javascript
// STRUCTURE CORRECTE ✓
const productData = {
  name: "Nom du produit",
  description: "Description du produit",
  price: 19.99,
  stock: 100,
  categoryId: 1,
  sizeIds: [1, 2, 3],
  
  // ⚠️ Cette partie est OBLIGATOIRE pour l'upload de design
  customDesign: {
    name: "Nom du design",
    description: "Description du design",
    image: "design_image.jpg"  // Doit correspondre au nom du fichier dans FormData
  },
  
  colors: [
    { name: "Rouge", hex: "#FF0000", image: "color_1.jpg" },
    // Autres couleurs...
  ]
};

const formData = new FormData();

// Ajouter le JSON
formData.append('product', JSON.stringify(productData));

// Ajouter l'image du design avec le MÊME nom que dans customDesign.image
formData.append('design_image.jpg', designImageFile);

// Ajouter les images des couleurs
formData.append('color_1.jpg', redColorFile);
```

## ❌ Ce qui ne fonctionne PAS

```javascript
// INCORRECT - Ne contient pas l'objet customDesign
const productData = {
  name: "Nom du produit",
  description: "Description du produit",
  price: 19.99,
  stock: 100,
  categoryId: 1,
  sizeIds: [1, 2, 3],
  colors: [...]
  // ❌ ERREUR: customDesign manquant!
};
```

## ✅ Exemple complet fonctionnel

```javascript
// 1. Récupérer les fichiers et données du formulaire
const designFile = document.getElementById('designInput').files[0];
const designName = document.getElementById('designName').value || "Design par défaut";
const designDesc = document.getElementById('designDesc').value || "";

// 2. Créer un nom de fichier pour le design
const designFileName = "design_" + Date.now() + ".jpg";

// 3. Créer l'objet produit AVEC customDesign
const productData = {
  name: document.getElementById('productName').value,
  description: document.getElementById('productDesc').value,
  price: parseFloat(document.getElementById('price').value),
  stock: parseInt(document.getElementById('stock').value),
  categoryId: parseInt(document.getElementById('category').value),
  sizeIds: Array.from(document.getElementById('sizes').selectedOptions).map(o => parseInt(o.value)),

  // ✅ OBLIGATOIRE: l'objet customDesign
  customDesign: {
    name: designName,
    description: designDesc,
    image: designFileName // IMPORTANT: référence au nom de fichier
  },

  // Données des couleurs
  colors: getColorsFromForm() // Votre fonction pour récupérer les couleurs
};

// 4. Créer le FormData
const formData = new FormData();
formData.append('product', JSON.stringify(productData));

// 5. Ajouter l'image du design
if (designFile) {
  formData.append(designFileName, designFile); // MÊME nom que dans customDesign.image
}

// 6. Ajouter les images des couleurs...
// ... votre code existant pour les couleurs

// 7. Envoyer la requête
const response = await fetch('/products', {
  method: 'POST',
  body: formData
});
```

## Pour les utilisateurs de React

```jsx
import { useState } from 'react';

function ProductForm() {
  const [designFile, setDesignFile] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Nom de fichier pour le design
    const designFileName = designFile ? 
      `design_${Date.now()}.jpg` : null;
    
    // Objet produit
    const productData = {
      name: "Mon produit",
      description: "Description du produit",
      price: 19.99,
      stock: 100,
      categoryId: 1,
      sizeIds: [1, 2, 3],
      // ✅ TOUJOURS inclure customDesign si vous avez un fichier design
      customDesign: designFile ? {
        name: "Mon design",
        description: "Description du design",
        image: designFileName
      } : undefined,
      colors: [
        // Vos couleurs
      ]
    };
    
    // FormData
    const formData = new FormData();
    formData.append('product', JSON.stringify(productData));
    
    // Ajouter le fichier design
    if (designFile && designFileName) {
      formData.append(designFileName, designFile);
      console.log(`Image design ajoutée: ${designFileName}`);
    }
    
    // Ajouter les images des couleurs
    // ...
    
    // Envoi
    const response = await fetch('/products', {
      method: 'POST',
      body: formData
    });
    
    // Traitement de la réponse
    const data = await response.json();
    console.log('Produit créé:', data);
  };
  
  // Reste du composant...
}
```

## Vérification

Avant d'envoyer, vérifiez votre JSON et FormData:

```javascript
// Vérifier le JSON
const productObj = JSON.parse(formData.get('product'));
console.log("customDesign présent:", !!productObj.customDesign);
console.log("customDesign.image:", productObj.customDesign?.image);

// Vérifier les fichiers
let filesFound = [];
for (let [key, value] of formData.entries()) {
  if (value instanceof File || value instanceof Blob) {
    filesFound.push(key);
  }
}
console.log("Fichiers dans FormData:", filesFound);
```

## Résumé

1. **TOUJOURS inclure** l'objet `customDesign` dans le JSON du produit
2. **TOUJOURS spécifier** la propriété `image` dans `customDesign` avec le nom du fichier
3. **TOUJOURS ajouter** le fichier image dans le FormData avec le **même nom exactement**

En suivant ces règles, votre image de design sera correctement uploadée sur Cloudinary. 