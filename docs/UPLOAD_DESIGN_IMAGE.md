# Guide pour l'upload d'images de design dans Cloudinary

## Problème identifié

Le problème actuel est que l'image du design n'est pas correctement téléchargée vers Cloudinary et reste à l'URL par défaut (`https://placeholder.com/100x100`).

## Solution détaillée

### 1. Vérifiez votre requête frontend

Assurez-vous que votre requête FormData contient bien l'image du design avec le **nom exact** spécifié dans votre JSON :

```javascript
// Dans le JSON
"customDesign": {
  "name": "Mon design",
  "description": "Super design",
  "image": "design123.jpg"  // Ce nom est crucial
}

// Dans le FormData - DOIT correspondre exactement
formData.append('design123.jpg', designImageFile);
```

l### 2. Exemple complet corrigé

```javascript
// Créer un nom de fichier unique pour éviter les conflits
const designFileName = `design_${Date.now()}.jpg`;

// Préparer les données du produit
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
    image: designFileName  // Utiliser le nom unique
  },
  colors: [
    // ... vos couleurs
  ]
};

// Créer le FormData
const formData = new FormData();

// Ajouter le JSON stringifié
formData.append('product', JSON.stringify(productData));

// Ajouter l'image du design AVEC LE MÊME NOM exactement
formData.append(designFileName, designImageFile);

// Vérification (important)
console.log("Contenu du FormData :");
for (let pair of formData.entries()) {
  console.log(pair[0]);  // Devrait afficher designFileName
}

// Envoyer la requête
const response = await fetch('/products', {
  method: 'POST',
  body: formData
});
```

### 3. Points de contrôle critiques

1. **Vérifiez le type du fichier image** : Assurez-vous que c'est un fichier image valide (JPG, PNG).

2. **Vérifiez la console du navigateur** : Il ne doit pas y avoir d'erreurs lors de la création du FormData.

3. **Inspectez la requête réseau** : Dans les outils de développement de votre navigateur (onglet Réseau), vérifiez que le FormData contient bien l'image du design.

4. **Doublez le nom du fichier** : Si vous avez un objet File, assurez-vous d'utiliser son nom exact dans `customDesign.image` :
   ```javascript
   const designFile = document.getElementById('designInput').files[0];
   const designFileName = designFile.name;
   
   productData.customDesign = {
     name: "Mon design",
     description: "Description",
     image: designFileName  // Utiliser exactement le même nom
   };
   
   formData.append(designFileName, designFile);
   ```

### 4. Exemple React complet

```jsx
import { useState } from 'react';

function ProductForm() {
  const [designFile, setDesignFile] = useState(null);
  const [designName, setDesignName] = useState('Design par défaut');
  const [designDescription, setDesignDescription] = useState('');
  
  const handleDesignFileChange = (e) => {
    setDesignFile(e.target.files[0]);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Créer un nom de fichier unique
    const designFileName = designFile ? 
      `design_${Date.now()}_${designFile.name}` : null;
    
    // Préparer les données
    const productData = {
      name: "T-shirt cool",
      description: "Un super t-shirt",
      price: 19.99,
      stock: 100,
      sizeIds: [1, 2, 3],
      categoryId: 1,
      customDesign: designFile ? {
        name: designName,
        description: designDescription,
        image: designFileName
      } : null,
      colors: [
        // ... vos couleurs
      ]
    };
    
    // Créer le FormData
    const formData = new FormData();
    formData.append('product', JSON.stringify(productData));
    
    // Ajouter l'image du design avec le nom exact
    if (designFile && designFileName) {
      // Créer un nouveau Blob avec le nom personnalisé
      const designBlob = new Blob([await designFile.arrayBuffer()], 
        { type: designFile.type });
      
      formData.append(designFileName, designBlob, designFileName);
    }
    
    // Vérifier le contenu
    console.log("Contenu du FormData:");
    for (let pair of formData.entries()) {
      console.log(pair[0]);
    }
    
    // Envoyer la requête
    try {
      const response = await fetch('/products', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      console.log('Produit créé:', data);
      
    } catch (error) {
      console.error("Erreur:", error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Autres champs du produit */}
      
      <div>
        <h3>Design</h3>
        <input
          type="text"
          value={designName}
          onChange={(e) => setDesignName(e.target.value)}
          placeholder="Nom du design"
        />
        <textarea
          value={designDescription}
          onChange={(e) => setDesignDescription(e.target.value)}
          placeholder="Description du design"
        />
        <input
          type="file"
          onChange={handleDesignFileChange}
          accept="image/*"
        />
      </div>
      
      {/* Autres champs (couleurs, etc.) */}
      
      <button type="submit">Créer le produit</button>
    </form>
  );
}
```

## Vérification côté serveur

Vérifiez les logs du serveur pour voir si l'image du design est bien reçue. Vous devriez voir des logs similaires à ceux-ci :

```
Design image: design_1234567890.jpg, trouvé: true
Upload du design image: design_1234567890.jpg
Design image uploadée: https://res.cloudinary.com/...
```

Si vous voyez `trouvé: false`, cela signifie que l'image n'a pas été correctement incluse dans le FormData, ou que le nom ne correspond pas. 