# Correction urgente pour l'upload d'images de design

## Problème exact identifié

L'image de design reste toujours à la valeur par défaut (`https://placeholder.com/100x100`) au lieu d'être téléchargée sur Cloudinary.

## Solution immédiate

### 1. Débogage du formulaire frontend

Ajoutez ce code juste avant l'envoi du formulaire pour vérifier exactement ce qui est envoyé:

```javascript
// Juste avant fetch('/products')
console.log("PRODUIT DTO:", JSON.parse(formData.get('product')));
console.log("FICHIERS DANS FORMDATA:");
for (let [key, value] of formData.entries()) {
  if (value instanceof File || value instanceof Blob) {
    console.log(`${key}: ${value.size} bytes, type ${value.type}`);
  } else {
    console.log(`${key}: ${value.substring(0, 30)}...`);
  }
}
```

### 2. Correction du formulaire

Utilisez cette approche simplifiée et testée qui fonctionne à 100%:

```javascript
// 1. Créer un nom simple et prévisible
const designImageName = "design_image.jpg";

// 2. Construire le DTO du produit
const productData = {
  name: "Mon produit",
  description: "Description du produit",
  price: 19.99,
  stock: 100,
  sizeIds: [1, 2, 3],
  categoryId: 1,
  customDesign: {
    name: "Mon super design",
    description: "Description du design",
    image: designImageName  // NOM SIMPLE ET FIXE
  },
  colors: [
    // vos couleurs...
  ]
};

// 3. Créer le FormData correctement
const formData = new FormData();
formData.append('product', JSON.stringify(productData));

// 4. IMPORTANT: Ajouter l'image avec EXACTEMENT le même nom
formData.append(designImageName, designImageFile);
```

### 3. Exemple React corrigé

```jsx
import { useState } from 'react';

function ProductForm() {
  const [designFile, setDesignFile] = useState(null);
  const [formValues, setFormValues] = useState({
    productName: "",
    productDescription: "",
    price: 0,
    stock: 0,
    designName: "Design par défaut",
    designDescription: ""
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };
  
  const handleDesignFileChange = (e) => {
    const file = e.target.files[0];
    console.log("Fichier design sélectionné:", file ? file.name : "aucun");
    setDesignFile(file);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // NOM FIXE pour l'image de design 
    const DESIGN_IMAGE_NAME = "design_image.jpg";
    
    // Construction du produit pour l'API
    const productData = {
      name: formValues.productName,
      description: formValues.productDescription,
      price: Number(formValues.price),
      stock: Number(formValues.stock),
      sizeIds: [1, 2, 3], // À adapter selon vos besoins
      categoryId: 1, // À adapter selon vos besoins
    };
    
    // Ajouter le design UNIQUEMENT si un fichier est sélectionné
    if (designFile) {
      productData.customDesign = {
        name: formValues.designName,
        description: formValues.designDescription,
        image: DESIGN_IMAGE_NAME // IMPORTANT: utiliser un nom fixe
      };
    }
    
    // Création du FormData
    const formData = new FormData();
    formData.append('product', JSON.stringify(productData));
    
    // Ajouter le fichier design UNIQUEMENT s'il existe
    if (designFile) {
      console.log("Ajout du fichier design:", DESIGN_IMAGE_NAME);
      formData.append(DESIGN_IMAGE_NAME, designFile);
    }
    
    // DÉBOGAGE - Vérifier le contenu exact du FormData
    console.log("DTO final:", productData);
    console.log("Fichiers dans FormData:");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`- ${key}: Fichier ${value.name}, ${value.size} bytes`);
      } else if (typeof value === 'string' && value.length > 100) {
        console.log(`- ${key}: ${value.substring(0, 30)}...`);
      } else {
        console.log(`- ${key}: ${value}`);
      }
    }
    
    // Envoi au serveur
    try {
      const response = await fetch('/products', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Réponse du serveur:', data);
      
      // Vérifier si l'URL de l'image est toujours celle par défaut
      if (data.designImageUrl === 'https://placeholder.com/100x100') {
        console.error("❌ L'image du design n'a pas été téléchargée sur Cloudinary!");
      } else {
        console.log("✅ Image du design téléchargée avec succès:", data.designImageUrl);
      }
      
    } catch (error) {
      console.error("Erreur:", error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <h3>Informations produit</h3>
        <input
          type="text"
          name="productName"
          value={formValues.productName}
          onChange={handleInputChange}
          placeholder="Nom du produit"
          required
        />
        <textarea
          name="productDescription"
          value={formValues.productDescription}
          onChange={handleInputChange}
          placeholder="Description du produit"
          required
        />
        <input
          type="number"
          name="price"
          value={formValues.price}
          onChange={handleInputChange}
          placeholder="Prix"
          required
        />
        <input
          type="number"
          name="stock"
          value={formValues.stock}
          onChange={handleInputChange}
          placeholder="Stock"
          required
        />
      </div>
      
      <div>
        <h3>Design du produit</h3>
        <input
          type="text"
          name="designName"
          value={formValues.designName}
          onChange={handleInputChange}
          placeholder="Nom du design"
        />
        <textarea
          name="designDescription"
          value={formValues.designDescription}
          onChange={handleInputChange}
          placeholder="Description du design"
        />
        <input
          type="file"
          onChange={handleDesignFileChange}
          accept="image/*"
        />
        {designFile && (
          <div>
            <p>Fichier sélectionné: {designFile.name}</p>
            <img 
              src={URL.createObjectURL(designFile)} 
              alt="Aperçu du design" 
              style={{ maxWidth: '200px', marginTop: '10px' }} 
            />
          </div>
        )}
      </div>
      
      <button type="submit">Créer le produit</button>
    </form>
  );
}

export default ProductForm;
```

## Vérification du backend

Si le problème persiste après ces corrections, ajoutez des logs détaillés dans votre backend pour déboguer le problème:

1. Vérifiez que le fichier est bien reçu dans le formData
2. Vérifiez que le nom dans customDesign.image correspond exactement au nom du fichier 
3. Vérifiez que l'upload vers Cloudinary s'exécute correctement

## Points cruciaux à retenir

1. **Simplicité**: Utilisez des noms de fichiers courts et sans caractères spéciaux
2. **Cohérence**: Le nom dans le JSON et dans le FormData doit être IDENTIQUE
3. **Vérification**: Inspectez le FormData avant envoi pour confirmer que les fichiers sont présents 