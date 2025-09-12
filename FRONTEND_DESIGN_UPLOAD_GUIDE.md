# 🎨 GUIDE FRONTEND - Upload de Designs avec Prix

## 📋 **Vue d'ensemble**

Ce guide explique comment uploader des designs avec leur prix depuis le frontend vers l'API backend.

---

## 🔗 **Endpoint à utiliser**

```
POST /api/designs
```

**⚠️ Important** : Ne pas utiliser `/vendor/designs` ou `/vendor/design-product/upload-design`

---

## 🔑 **Authentification requise**

```javascript
// Token JWT obligatoire dans les headers
headers: {
  'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
}
```

---

## 📝 **Format des données**

### **Content-Type** : `multipart/form-data`

### **Champs obligatoires** :
- `file` : Fichier image (PNG, JPG, JPEG, SVG, WebP - max 10MB)
- `name` : Nom du design (3-255 caractères)
- `price` : Prix en FCFA (100 - 1,000,000)
- `category` : Catégorie (`logo`, `pattern`, `illustration`, `typography`, `abstract`)

### **Champs optionnels** :
- `description` : Description du design (max 1000 caractères)
- `tags` : Tags séparés par des virgules

---

## 💻 **Code JavaScript - Service d'upload**

```javascript
// designService.js
class DesignService {
  constructor() {
    this.baseURL = '/api/designs';
  }

  // Récupérer le token d'authentification
  getAuthToken() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('Utilisateur non authentifié');
    }
    return token;
  }

  // Méthode principale d'upload
  async createDesign(designData, file) {
    try {
      console.log('🎨 Upload du design avec prix:', designData.price);
      
      // Validation des données
      this.validateDesignData(designData, file);
      
      // Création du FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', designData.name.trim());
      
      if (designData.description) {
        formData.append('description', designData.description.trim());
      }
      
      // ✅ IMPORTANT: Prix au format string
      formData.append('price', designData.price.toString());
      formData.append('category', designData.category);
      
      if (designData.tags) {
        formData.append('tags', designData.tags);
      }
      
      // Envoi de la requête
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
          // ⚠️ NE PAS ajouter Content-Type pour multipart/form-data
        },
        body: formData
      });
      
      // Traitement de la réponse
      return await this.handleResponse(response);
      
    } catch (error) {
      console.error('❌ Erreur upload design:', error);
      throw error;
    }
  }

  // Validation des données avant envoi
  validateDesignData(designData, file) {
    if (!file) {
      throw new Error('Fichier image requis');
    }
    
    if (!designData.name || designData.name.trim().length < 3) {
      throw new Error('Nom du design requis (min 3 caractères)');
    }
    
    if (!designData.price || designData.price < 100) {
      throw new Error('Prix minimum: 100 FCFA');
    }
    
    if (designData.price > 1000000) {
      throw new Error('Prix maximum: 1,000,000 FCFA');
    }
    
    const allowedCategories = ['logo', 'pattern', 'illustration', 'typography', 'abstract'];
    if (!allowedCategories.includes(designData.category)) {
      throw new Error('Catégorie invalide');
    }
    
    // Validation du fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Format de fichier non supporté');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('Fichier trop volumineux (max 10MB)');
    }
  }

  // Traitement de la réponse
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      switch (response.status) {
        case 400:
          throw new Error(errorData.message || 'Données invalides');
        case 401:
          throw new Error('Utilisateur non authentifié');
        case 413:
          throw new Error('Fichier trop volumineux');
        default:
          throw new Error(`Erreur HTTP ${response.status}`);
      }
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Design créé avec succès:', data.data);
      return data.data;
    } else {
      throw new Error(data.message || 'Erreur inconnue');
    }
  }
}

// Instance globale
const designService = new DesignService();
```

---

## ⚛️ **Code React - Composant d'upload**

```jsx
import React, { useState } from 'react';

const DesignUploadForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 2500,
    category: 'logo',
    tags: ''
  });
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Gestion du changement de fichier
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Validation côté client
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setMessage('❌ Format de fichier non supporté');
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setMessage('❌ Fichier trop volumineux (max 10MB)');
        return;
      }
      
      setFile(selectedFile);
      setMessage('');
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage('❌ Veuillez sélectionner un fichier');
      return;
    }
    
    setIsLoading(true);
    setMessage('🎨 Upload en cours...');
    
    try {
      const design = await designService.createDesign(formData, file);
      
      setMessage(`✅ Design créé avec succès! ID: ${design.id}, Prix: ${design.price} FCFA`);
      
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        description: '',
        price: 2500,
        category: 'logo',
        tags: ''
      });
      setFile(null);
      
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="design-upload-form">
      <h2>📝 Créer un nouveau design</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Nom du design */}
        <div className="form-group">
          <label>Nom du design *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Ex: Logo moderne entreprise"
            required
            minLength="3"
            maxLength="255"
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Description détaillée du design"
            maxLength="1000"
            rows="3"
          />
        </div>

        {/* Prix */}
        <div className="form-group">
          <label>Prix (FCFA) *</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
            min="100"
            max="1000000"
            step="50"
            required
          />
          <small>Entre 100 et 1,000,000 FCFA</small>
        </div>

        {/* Catégorie */}
        <div className="form-group">
          <label>Catégorie *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            required
          >
            <option value="logo">Logo</option>
            <option value="pattern">Motif</option>
            <option value="illustration">Illustration</option>
            <option value="typography">Typographie</option>
            <option value="abstract">Abstrait</option>
          </select>
        </div>

        {/* Tags */}
        <div className="form-group">
          <label>Tags</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({...formData, tags: e.target.value})}
            placeholder="moderne, entreprise, tech"
          />
          <small>Séparer par des virgules</small>
        </div>

        {/* Fichier */}
        <div className="form-group">
          <label>Fichier image *</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml,image/webp"
            required
          />
          <small>PNG, JPG, JPEG, SVG, WebP - Max 10MB</small>
        </div>

        {/* Bouton submit */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? '🔄 Upload...' : '📤 Créer le design'}
        </button>
      </form>

      {/* Message de retour */}
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default DesignUploadForm;
```

---

## 🎯 **Exemple d'utilisation simple**

```javascript
// Fonction d'upload simplifiée
async function uploadDesign() {
  const fileInput = document.getElementById('designFile');
  const nameInput = document.getElementById('designName');
  const priceInput = document.getElementById('designPrice');
  
  try {
    const design = await designService.createDesign({
      name: nameInput.value,
      description: 'Mon design personnalisé',
      price: Number(priceInput.value),
      category: 'logo',
      tags: 'moderne, créatif'
    }, fileInput.files[0]);
    
    alert(`✅ Design créé! Prix: ${design.price} FCFA`);
    
  } catch (error) {
    alert(`❌ Erreur: ${error.message}`);
  }
}

// HTML correspondant
/*
<input type="file" id="designFile" accept="image/*" />
<input type="text" id="designName" placeholder="Nom du design" />
<input type="number" id="designPrice" value="2500" min="100" max="1000000" />
<button onclick="uploadDesign()">Upload Design</button>
*/
```

---

## 📊 **Format de la réponse**

### **Succès (201 Created)** :
```json
{
  "success": true,
  "message": "Design créé avec succès",
  "data": {
    "id": 123,
    "name": "Logo moderne entreprise",
    "description": "Un logo épuré et moderne",
    "price": 2500,
    "category": "LOGO",
    "imageUrl": "https://res.cloudinary.com/.../design.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../thumb.jpg",
    "fileSize": 157340,
    "originalFileName": "logo.png",
    "dimensions": { "width": 800, "height": 600 },
    "format": "png",
    "tags": ["moderne", "entreprise"],
    "isDraft": true,
    "isPublished": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "vendor": {
      "id": 456,
      "firstName": "Jean",
      "lastName": "Dupont"
    }
  }
}
```

### **Erreurs possibles** :
```json
// 400 Bad Request
{
  "success": false,
  "message": "Le prix minimum est de 100 FCFA",
  "statusCode": 400
}

// 401 Unauthorized
{
  "success": false,
  "message": "Token d'authentification requis",
  "statusCode": 401
}

// 413 Payload Too Large
{
  "success": false,
  "message": "Fichier trop volumineux (max 10MB)",
  "statusCode": 413
}
```

---

## ✅ **Checklist Frontend**

- [ ] Utiliser l'endpoint `/api/designs`
- [ ] Ajouter le token JWT dans les headers
- [ ] Formater le prix en string dans le FormData
- [ ] Ne pas définir Content-Type pour multipart/form-data
- [ ] Valider les données côté client
- [ ] Gérer les erreurs d'authentification
- [ ] Afficher les messages de succès/erreur
- [ ] Vérifier la taille et le format du fichier

---

## 🔧 **Dépannage**

### **Problème : Prix à 0**
```javascript
// ❌ Incorrect
formData.append('price', designData.price); // peut être undefined

// ✅ Correct
formData.append('price', (designData.price || 2500).toString());
```

### **Problème : 401 Unauthorized**
```javascript
// Vérifier le token
const token = localStorage.getItem('jwt_token');
if (!token) {
  window.location.href = '/login';
  return;
}
```

### **Problème : 404 Not Found**
```javascript
// ❌ Mauvais endpoint
fetch('/vendor/design-product/upload-design', ...)

// ✅ Bon endpoint
fetch('/api/designs', ...)
```

---

## 📞 **Support**

Pour toute question technique sur l'implémentation frontend, référez-vous à ce guide ou consultez les logs de développement pour identifier les erreurs spécifiques.