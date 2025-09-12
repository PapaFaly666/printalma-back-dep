# 📸 GUIDE FRONTEND - Upload d'Images de Couverture pour Catégories

## 📋 **Vue d'ensemble**

Ce guide explique comment implémenter l'upload d'images de couverture pour les catégories de design. Les admins peuvent maintenant ajouter des images visuelles attractives au lieu des simples icônes et couleurs.

---

## 🔗 **Endpoints avec Upload d'Images**

```
POST /design-categories/admin    → Créer catégorie avec image (multipart/form-data)
PUT  /design-categories/admin/1  → Modifier catégorie avec nouvelle image
```

---

## 📝 **Format d'Upload (multipart/form-data)**

**Content-Type**: `multipart/form-data` obligatoire

### Champs disponibles
- `name` : string - Nom de la catégorie (requis)
- `description` : string - Description (optionnel)
- `slug` : string - Slug personnalisé (optionnel, généré auto)
- `coverImage` : File - Image de couverture (PNG, JPG, WEBP)
- `isActive` : boolean - Statut actif (défaut: true)
- `sortOrder` : number - Ordre d'affichage (défaut: 0)

### Spécifications Image
- **Formats acceptés** : PNG, JPG, WEBP
- **Taille max** : 5MB
- **Redimensionnement auto** : 800x600px (crop: fill)
- **Optimisation** : Compression automatique via Cloudinary

---

## 💻 **Service JavaScript - Upload d'Images**

```javascript
// designCategoryService.js
class DesignCategoryService {
  constructor() {
    this.baseURL = '/design-categories';
  }

  getAdminToken() {
    const token = localStorage.getItem('admin_jwt_token');
    if (!token) throw new Error('Administrateur non authentifié');
    return token;
  }

  // Créer une catégorie avec image
  async createCategory(categoryData, imageFile = null) {
    const formData = new FormData();
    
    // Ajouter les champs texte
    Object.entries(categoryData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    // Ajouter l'image si fournie
    if (imageFile) {
      formData.append('coverImage', imageFile);
    }

    const response = await fetch(`${this.baseURL}/admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAdminToken()}`
        // Ne pas définir Content-Type pour multipart/form-data
      },
      body: formData
    });

    return this.handleResponse(response);
  }

  // Mettre à jour une catégorie avec nouvelle image
  async updateCategory(categoryId, updates, imageFile = null) {
    const formData = new FormData();
    
    // Ajouter les champs à modifier
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    // Ajouter la nouvelle image si fournie
    if (imageFile) {
      formData.append('coverImage', imageFile);
    }

    const response = await fetch(`${this.baseURL}/admin/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getAdminToken()}`
      },
      body: formData
    });

    return this.handleResponse(response);
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      switch (response.status) {
        case 400:
          throw new Error(errorData.message || 'Données invalides');
        case 401:
          throw new Error('Administrateur non authentifié');
        case 403:
          throw new Error('Accès refusé');
        case 413:
          throw new Error('Image trop volumineuse (max 5MB)');
        case 415:
          throw new Error('Format d\'image non supporté (PNG/JPG/WEBP uniquement)');
        default:
          throw new Error(`Erreur HTTP ${response.status}`);
      }
    }
    return await response.json();
  }
}

export const designCategoryService = new DesignCategoryService();
```

---

## ⚛️ **Composant React - Upload avec Drag & Drop**

```jsx
import React, { useState, useRef } from 'react';
import { designCategoryService } from './designCategoryService';

const CategoryImageUploader = ({ onImageSelect, currentImage = null, preview = null }) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validation côté client
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Format non supporté. Utilisez PNG, JPG ou WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop volumineuse. Maximum 5MB.');
      return;
    }

    onImageSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label>Image de couverture</label>
      
      {/* Zone de drop */}
      <div
        style={{
          border: `2px dashed ${dragOver ? '#007bff' : '#ddd'}`,
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragOver ? '#f8f9fa' : 'white',
          transition: 'all 0.3s ease'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <div>
            <img 
              src={preview} 
              alt="Aperçu" 
              style={{ 
                maxWidth: '200px', 
                maxHeight: '150px', 
                objectFit: 'cover',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            />
            <p>Cliquez ou glissez pour changer l'image</p>
          </div>
        ) : currentImage ? (
          <div>
            <img 
              src={currentImage} 
              alt="Image actuelle" 
              style={{ 
                maxWidth: '200px', 
                maxHeight: '150px', 
                objectFit: 'cover',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            />
            <p>Cliquez ou glissez pour changer l'image</p>
          </div>
        ) : (
          <div>
            <p>📸 Cliquez ou glissez une image ici</p>
            <p><small>PNG, JPG, WEBP - Max 5MB</small></p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files[0])}
      />
    </div>
  );
};

const CreateCategoryForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    sortOrder: 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleImageSelect = (file) => {
    setImageFile(file);
    
    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage('❌ Le nom de la catégorie est requis');
      return;
    }

    setIsSubmitting(true);
    setMessage('🔄 Création en cours...');

    try {
      const result = await designCategoryService.createCategory(formData, imageFile);
      setMessage('✅ Catégorie créée avec succès');
      
      // Reset form
      setFormData({ name: '', description: '', isActive: true, sortOrder: 0 });
      setImageFile(null);
      setImagePreview(null);
      
      onSuccess && onSuccess(result);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>➕ Nouvelle Catégorie de Design</h2>

      <div style={{ marginBottom: '15px' }}>
        <label>Nom de la catégorie *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          placeholder="Logo Design"
          required
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
          placeholder="Description de la catégorie..."
        />
      </div>

      <CategoryImageUploader 
        onImageSelect={handleImageSelect}
        preview={imagePreview}
      />

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
          />
          Catégorie active
        </label>

        <div>
          <label>Ordre d'affichage</label>
          <input
            type="number"
            value={formData.sortOrder}
            onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
            style={{ width: '80px', padding: '4px', marginLeft: '10px' }}
            min="0"
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        style={{
          backgroundColor: isSubmitting ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '4px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer'
        }}
      >
        {isSubmitting ? '🔄 Création...' : '💾 Créer la Catégorie'}
      </button>

      {message && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          borderRadius: '4px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}
    </form>
  );
};

export default CreateCategoryForm;
```

---

## 🏪 **Liste des Catégories avec Images**

```jsx
import React, { useState, useEffect } from 'react';

const CategoryCard = ({ category, onEdit, onDelete }) => (
  <div 
    style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      opacity: category.isActive ? 1 : 0.6
    }}
  >
    {/* Image de couverture */}
    {category.coverImageUrl && (
      <div style={{ height: '200px', overflow: 'hidden' }}>
        <img 
          src={category.coverImageUrl}
          alt={category.name}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }}
        />
      </div>
    )}

    <div style={{ padding: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <h3 style={{ margin: '0 0 10px 0', color: category.isActive ? '#333' : '#999' }}>
          {category.name}
          {!category.isActive && <small> (Inactive)</small>}
        </h3>
        <span style={{
          backgroundColor: '#f0f0f0',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          color: '#666'
        }}>
          {category.designCount} designs
        </span>
      </div>

      {category.description && (
        <p style={{ 
          margin: '0 0 15px 0', 
          color: '#666', 
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
          {category.description}
        </p>
      )}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '15px'
      }}>
        <small style={{ color: '#999' }}>
          Ordre: {category.sortOrder} • Slug: {category.slug}
        </small>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onEdit(category)}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✏️ Modifier
          </button>
          
          <button
            onClick={() => onDelete(category.id, category.name)}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
);

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadCategories();
  }, [filters]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const result = await designCategoryService.getCategories(filters);
      setCategories(result.categories || []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id, name) => {
    if (!window.confirm(`Supprimer la catégorie "${name}" ?`)) return;

    try {
      await designCategoryService.deleteCategory(id);
      loadCategories(); // Reload
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const editCategory = (category) => {
    // Ouvrir modal d'édition ou naviguer vers page d'édition
    console.log('Edit category:', category);
  };

  if (loading) return <div>🔄 Chargement des catégories...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>🎨 Catégories de Design</h2>

      {/* Filtres */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label>
          <input
            type="checkbox"
            checked={filters.isActive !== false}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              isActive: e.target.checked ? undefined : false 
            }))}
          />
          Afficher seulement les actives
        </label>
        
        <input
          type="text"
          placeholder="Rechercher..."
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value || undefined }))}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      {/* Grille des catégories */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {categories.map(category => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={editCategory}
            onDelete={deleteCategory}
          />
        ))}
      </div>

      {categories.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Aucune catégorie trouvée
        </div>
      )}
    </div>
  );
};

export default CategoryList;
```

---

## ✅ **Checklist d'Implémentation**

### Pour l'Upload d'Images
- [ ] Utiliser `multipart/form-data` pour les formulaires
- [ ] Valider le format côté client (PNG/JPG/WEBP)
- [ ] Limiter la taille à 5MB maximum
- [ ] Implémenter le drag & drop pour UX améliorée
- [ ] Prévisualiser l'image avant upload
- [ ] Gérer les erreurs d'upload spécifiques

### Pour l'Affichage des Catégories
- [ ] Afficher les images de couverture dans les listes
- [ ] Implémenter un fallback si pas d'image
- [ ] Optimiser le chargement des images (lazy loading)
- [ ] Responsive design pour tous les écrans
- [ ] Images avec bon ratio (800x600 → 4:3)

### Pour la Gestion Admin
- [ ] Interface d'upload intuitive avec drag & drop
- [ ] Possibilité de remplacer les images existantes
- [ ] Suppression automatique des anciennes images
- [ ] Messages d'erreur clairs pour les problèmes d'upload
- [ ] Aperçu en temps réel des modifications

---

## 🔧 **Dépannage**

### Problème : Upload échoue avec 413 (trop volumineux)
```javascript
// Vérifier la taille côté client
if (file.size > 5 * 1024 * 1024) {
  alert('Image trop volumineuse. Maximum 5MB.');
  return;
}
```

### Problème : Format non supporté
```javascript
const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
if (!validTypes.includes(file.type)) {
  alert('Format non supporté. Utilisez PNG, JPG ou WEBP.');
  return;
}
```

### Problème : Multipart/form-data pas reconnu
```javascript
// ✅ Correct - Ne pas définir Content-Type
const formData = new FormData();
formData.append('coverImage', file);

fetch('/endpoint', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token'
    // PAS de Content-Type
  },
  body: formData
});
```

---

## 📞 **Support**

L'upload d'images de couverture remplace le système précédent d'icônes et couleurs, offrant une expérience visuelle plus riche et moderne pour les catégories de design.