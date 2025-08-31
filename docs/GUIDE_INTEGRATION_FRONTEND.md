# Guide d'intégration front-end pour l'upload de produits

Ce guide explique pas à pas comment implémenter l'upload d'un produit avec design et couleurs depuis votre application front-end.

## Table des matières

1. [Structure de la requête](#1-structure-de-la-requête)
2. [Exemple d'implémentation en JavaScript](#2-exemple-dimplémentation-en-javascript)
3. [Exemple en React](#3-exemple-en-react)
4. [Exemple en Vue.js](#4-exemple-en-vuejs)
5. [Points importants à vérifier](#5-points-importants-à-vérifier)
6. [Résolution des problèmes courants](#6-résolution-des-problèmes-courants)

## 1. Structure de la requête

Pour créer un produit avec ses designs et couleurs, vous devez envoyer une requête `POST` à `/products` avec un `FormData` contenant:

- Un champ `product` qui est un objet JSON stringifié contenant les informations du produit
- Des champs pour chaque fichier image, avec un nom correspondant à celui défini dans votre JSON

### Format du JSON à inclure dans le champ `product`

```javascript
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
    "image": "design.jpg"  // IMPORTANT: doit correspondre au nom du fichier
  },
  "colors": [
    {
      "name": "Rouge", 
      "hex": "#FF0000",
      "image": "rouge.jpg"  // IMPORTANT: doit correspondre au nom du fichier
    },
    {
      "name": "Bleu", 
      "hex": "#0000FF",
      "image": "bleu.jpg"   // IMPORTANT: doit correspondre au nom du fichier
    }
  ]
}
```

## 2. Exemple d'implémentation en JavaScript

```javascript
// Fonction pour créer un produit avec design et couleurs
async function createProduct(productData, designImage, colorImages) {
  // 1. Créer un objet FormData
  const formData = new FormData();
  
  // 2. Préparer l'objet produit avec les références aux images
  const product = {
    ...productData,
    customDesign: productData.customDesign 
      ? {
          ...productData.customDesign,
          image: designImage ? designImage.name : undefined
        }
      : undefined,
    colors: productData.colors.map((color, index) => ({
      ...color,
      image: colorImages[index] ? colorImages[index].name : undefined
    }))
  };
  
  // 3. Ajouter le JSON stringifié au FormData
  formData.append('product', JSON.stringify(product));
  
  // 4. Ajouter l'image du design (s'il y en a une)
  if (designImage) {
    formData.append(designImage.name, designImage);
  }
  
  // 5. Ajouter les images des couleurs
  colorImages.forEach(image => {
    if (image) {
      formData.append(image.name, image);
    }
  });
  
  // 6. Envoyer la requête
  try {
    const response = await fetch('/products', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Produit créé avec succès:', data);
    return data;
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    throw error;
  }
}

// Exemple d'utilisation
const productData = {
  name: 'T-shirt cool',
  description: 'Un super t-shirt très confortable',
  price: 19.99,
  stock: 100,
  sizeIds: [1, 2, 3],
  categoryId: 1,
  customDesign: {
    name: 'Mon design',
    description: 'Super design'
  },
  colors: [
    { name: 'Rouge', hex: '#FF0000' },
    { name: 'Bleu', hex: '#0000FF' }
  ]
};

// Ces variables représentent les objets File obtenus depuis des <input type="file">
const designImage = designFileInput.files[0];
const colorImages = [
  redColorFileInput.files[0],
  blueColorFileInput.files[0]
];

// Appeler la fonction
createProduct(productData, designImage, colorImages)
  .then(response => {
    // Traiter la réponse
  })
  .catch(error => {
    // Gérer l'erreur
  });
```

## 3. Exemple en React

```jsx
import { useState } from 'react';

function ProductForm() {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    sizeIds: [],
    categoryId: 1,
    customDesign: {
      name: '',
      description: ''
    },
    colors: []
  });
  
  const [designImage, setDesignImage] = useState(null);
  const [colorImages, setColorImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Gestion du changement des champs du produit
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]: value
    });
  };
  
  // Gestion du changement du design
  const handleDesignChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      customDesign: {
        ...product.customDesign,
        [name]: value
      }
    });
  };
  
  // Gestion de l'image du design
  const handleDesignImageChange = (e) => {
    setDesignImage(e.target.files[0]);
  };
  
  // Ajouter une nouvelle couleur
  const addColor = () => {
    setProduct({
      ...product,
      colors: [
        ...product.colors,
        { name: '', hex: '#000000' }
      ]
    });
    setColorImages([...colorImages, null]);
  };
  
  // Mise à jour d'une couleur
  const updateColor = (index, field, value) => {
    const updatedColors = [...product.colors];
    updatedColors[index] = {
      ...updatedColors[index],
      [field]: value
    };
    setProduct({
      ...product,
      colors: updatedColors
    });
  };
  
  // Mise à jour de l'image d'une couleur
  const updateColorImage = (index, file) => {
    const updatedImages = [...colorImages];
    updatedImages[index] = file;
    setColorImages(updatedImages);
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // 1. Créer un objet FormData
      const formData = new FormData();
      
      // 2. Préparer l'objet produit avec les références aux images
      const productData = {
        ...product,
        customDesign: product.customDesign.name 
          ? {
              ...product.customDesign,
              image: designImage ? designImage.name : undefined
            }
          : undefined,
        colors: product.colors.map((color, index) => ({
          ...color,
          image: colorImages[index] ? colorImages[index].name : undefined
        }))
      };
      
      // 3. Ajouter le JSON stringifié au FormData
      formData.append('product', JSON.stringify(productData));
      
      // 4. Ajouter l'image du design (s'il y en a une)
      if (designImage) {
        formData.append(designImage.name, designImage);
      }
      
      // 5. Ajouter les images des couleurs
      colorImages.forEach((image, index) => {
        if (image) {
          formData.append(image.name, image);
        }
      });
      
      // 6. Envoyer la requête
      const response = await fetch('/products', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Produit créé avec succès:', data);
      setSuccess(true);
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>Informations du produit</h2>
      
      <div>
        <label>Nom:</label>
        <input 
          type="text"
          name="name"
          value={product.name}
          onChange={handleProductChange}
          required
        />
      </div>
      
      <div>
        <label>Description:</label>
        <textarea
          name="description"
          value={product.description}
          onChange={handleProductChange}
          required
        ></textarea>
      </div>
      
      <div>
        <label>Prix:</label>
        <input
          type="number"
          name="price"
          step="0.01"
          value={product.price}
          onChange={handleProductChange}
          required
        />
      </div>
      
      <div>
        <label>Stock:</label>
        <input
          type="number"
          name="stock"
          value={product.stock}
          onChange={handleProductChange}
          required
        />
      </div>
      
      <h2>Design</h2>
      <div>
        <label>Nom du design:</label>
        <input
          type="text"
          name="name"
          value={product.customDesign.name}
          onChange={handleDesignChange}
        />
      </div>
      
      <div>
        <label>Description du design:</label>
        <input
          type="text"
          name="description"
          value={product.customDesign.description}
          onChange={handleDesignChange}
        />
      </div>
      
      <div>
        <label>Image du design:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleDesignImageChange}
        />
      </div>
      
      <h2>Couleurs</h2>
      <button type="button" onClick={addColor}>
        Ajouter une couleur
      </button>
      
      {product.colors.map((color, index) => (
        <div key={index} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <div>
            <label>Nom de la couleur:</label>
            <input
              type="text"
              value={color.name}
              onChange={(e) => updateColor(index, 'name', e.target.value)}
              required
            />
          </div>
          
          <div>
            <label>Code couleur:</label>
            <input
              type="color"
              value={color.hex}
              onChange={(e) => updateColor(index, 'hex', e.target.value)}
            />
          </div>
          
          <div>
            <label>Image de la couleur:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => updateColorImage(index, e.target.files[0])}
            />
          </div>
        </div>
      ))}
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>Produit créé avec succès!</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Création...' : 'Créer le produit'}
      </button>
    </form>
  );
}

export default ProductForm;
```

## 4. Exemple en Vue.js

```vue
<template>
  <form @submit.prevent="submitForm">
    <h2>Informations du produit</h2>
    
    <div>
      <label>Nom:</label>
      <input 
        type="text"
        v-model="product.name"
        required
      />
    </div>
    
    <div>
      <label>Description:</label>
      <textarea
        v-model="product.description"
        required
      ></textarea>
    </div>
    
    <div>
      <label>Prix:</label>
      <input
        type="number"
        step="0.01"
        v-model.number="product.price"
        required
      />
    </div>
    
    <div>
      <label>Stock:</label>
      <input
        type="number"
        v-model.number="product.stock"
        required
      />
    </div>
    
    <h2>Design</h2>
    <div>
      <label>Nom du design:</label>
      <input
        type="text"
        v-model="product.customDesign.name"
      />
    </div>
    
    <div>
      <label>Description du design:</label>
      <input
        type="text"
        v-model="product.customDesign.description"
      />
    </div>
    
    <div>
      <label>Image du design:</label>
      <input
        type="file"
        accept="image/*"
        @change="handleDesignImageChange"
      />
    </div>
    
    <h2>Couleurs</h2>
    <button type="button" @click="addColor">
      Ajouter une couleur
    </button>
    
    <div 
      v-for="(color, index) in product.colors" 
      :key="index" 
      style="margin-bottom: 20px; padding: 10px; border: 1px solid #ccc"
    >
      <div>
        <label>Nom de la couleur:</label>
        <input
          type="text"
          v-model="color.name"
          required
        />
      </div>
      
      <div>
        <label>Code couleur:</label>
        <input
          type="color"
          v-model="color.hex"
        />
      </div>
      
      <div>
        <label>Image de la couleur:</label>
        <input
          type="file"
          accept="image/*"
          @change="(e) => handleColorImageChange(e, index)"
        />
      </div>
    </div>
    
    <div v-if="error" style="color: red">{{ error }}</div>
    <div v-if="success" style="color: green">Produit créé avec succès!</div>
    
    <button type="submit" :disabled="loading">
      {{ loading ? 'Création...' : 'Créer le produit' }}
    </button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      product: {
        name: '',
        description: '',
        price: 0,
        stock: 0,
        sizeIds: [1, 2, 3], // À adapter selon vos besoins
        categoryId: 1,
        customDesign: {
          name: '',
          description: ''
        },
        colors: []
      },
      designImage: null,
      colorImages: [],
      loading: false,
      error: null,
      success: false
    };
  },
  methods: {
    addColor() {
      this.product.colors.push({
        name: '',
        hex: '#000000'
      });
      this.colorImages.push(null);
    },
    handleDesignImageChange(e) {
      this.designImage = e.target.files[0];
    },
    handleColorImageChange(e, index) {
      this.$set(this.colorImages, index, e.target.files[0]);
    },
    async submitForm() {
      this.loading = true;
      this.error = null;
      this.success = false;
      
      try {
        // 1. Créer un objet FormData
        const formData = new FormData();
        
        // 2. Préparer l'objet produit avec les références aux images
        const productData = {
          ...this.product,
          customDesign: this.product.customDesign.name 
            ? {
                ...this.product.customDesign,
                image: this.designImage ? this.designImage.name : undefined
              }
            : undefined,
          colors: this.product.colors.map((color, index) => ({
            ...color,
            image: this.colorImages[index] ? this.colorImages[index].name : undefined
          }))
        };
        
        // 3. Ajouter le JSON stringifié au FormData
        formData.append('product', JSON.stringify(productData));
        
        // 4. Ajouter l'image du design (s'il y en a une)
        if (this.designImage) {
          formData.append(this.designImage.name, this.designImage);
        }
        
        // 5. Ajouter les images des couleurs
        this.colorImages.forEach((image, index) => {
          if (image) {
            formData.append(image.name, image);
          }
        });
        
        // 6. Envoyer la requête
        const response = await fetch('/products', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Produit créé avec succès:', data);
        this.success = true;
      } catch (error) {
        console.error('Erreur lors de la création du produit:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

## 5. Points importants à vérifier

- **Correspondance des noms de fichiers** : Le nom du fichier dans le FormData DOIT être EXACTEMENT le même que celui référencé dans le JSON.
- **Format des images** : Utilisez des formats d'image standard (JPEG, PNG) supportés par Cloudinary.
- **Taille des images** : Assurez-vous que les images ne sont pas trop volumineuses pour éviter des délais d'upload trop longs.
- **Structure du JSON** : Le format du JSON envoyé doit respecter exactement la structure attendue par le backend.
- **Multiples couleurs** : Vous pouvez ajouter autant de couleurs que nécessaire.

## 6. Résolution des problèmes courants

### Les images ne s'affichent pas sur Cloudinary

1. **Vérifiez les noms des fichiers** : Assurez-vous que le nom dans le JSON (`"image": "design.jpg"`) correspond exactement au nom du fichier dans le FormData.
2. **Inspectez la requête** : Utilisez les outils de développement du navigateur (onglet Réseau) pour vérifier que les fichiers sont bien envoyés dans le FormData.
3. **Vérifiez les logs du serveur** : Des logs détaillés sont générés côté serveur, demandez-les pour identifier où le problème se produit.

### Erreur 400 lors de l'envoi

1. **Contenu du JSON** : Vérifiez que le JSON est valide et contient tous les champs requis.
2. **Fichiers manquants** : Assurez-vous que tous les fichiers référencés dans le JSON sont bien présents dans le FormData.
3. **Type MIME** : Vérifiez que les fichiers sont bien reconnus comme des images par le navigateur.

### Erreur côté serveur

1. **Redémarrez l'API** : Parfois, un simple redémarrage du serveur peut résoudre certains problèmes.
2. **Vérifiez les credentials Cloudinary** : Assurez-vous que les identifiants d'API Cloudinary sont correctement configurés sur le serveur.
3. **Taille maximale** : Vérifiez la taille maximale d'upload autorisée par votre configuration serveur. 