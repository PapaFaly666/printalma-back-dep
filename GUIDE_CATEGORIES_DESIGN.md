# 🎨 Guide des Catégories de Design - Frontend

## 📋 **Vue d'ensemble**

Les catégories de design sont maintenant dynamiques ! Les admins peuvent créer/modifier des catégories et les vendeurs peuvent les utiliser lors de la création de leurs designs.

---

## 🔗 **Nouveaux Endpoints Disponibles**

### 👑 **Endpoints Admin (Token requis)**

```
POST   /design-categories/admin          - Créer une catégorie
GET    /design-categories/admin          - Lister toutes les catégories (avec pagination)
GET    /design-categories/admin/:id      - Récupérer une catégorie par ID
PUT    /design-categories/admin/:id      - Modifier une catégorie
DELETE /design-categories/admin/:id      - Supprimer une catégorie
```

### 🌐 **Endpoints Public (Vendeurs)**

```
GET    /design-categories/active         - Récupérer les catégories actives
GET    /design-categories/slug/:slug     - Récupérer une catégorie par slug
```

---

## 🔑 **Authentification**

**Admin uniquement pour les endpoints /admin :**
```javascript
headers: {
  'Authorization': 'Bearer YOUR_ADMIN_JWT_TOKEN'
}
```

---

## 📝 **Structure d'une Catégorie**

```typescript
interface DesignCategory {
  id: number;
  name: string;               // "Logo Design"
  description?: string;       // "Catégorie pour logos..."
  slug: string;              // "logo-design"
  icon?: string;             // "🎨" ou nom d'icône
  color?: string;            // "#FF5722"
  isActive: boolean;         // true/false
  sortOrder: number;         // 0, 10, 20...
  designCount: number;       // Nombre de designs dans cette catégorie
  createdAt: string;         // ISO date
  updatedAt: string;         // ISO date
  creator: {
    id: number;
    firstName: string;
    lastName: string;
  };
}
```

---

## 💻 **Service JavaScript - Catégories**

```javascript
// designCategoryService.js
class DesignCategoryService {
  constructor() {
    this.baseURL = '/design-categories';
  }

  getAdminToken() {
    const token = localStorage.getItem('admin_jwt_token');
    if (!token) throw new Error('Token admin requis');
    return token;
  }

  // 🌐 PUBLIC - Récupérer les catégories actives (pour vendeurs)
  async getActiveCategories() {
    const response = await fetch(`${this.baseURL}/active`);
    if (!response.ok) throw new Error('Erreur récupération catégories');
    return response.json();
  }

  // 🌐 PUBLIC - Récupérer une catégorie par slug
  async getCategoryBySlug(slug) {
    const response = await fetch(`${this.baseURL}/slug/${slug}`);
    if (!response.ok) throw new Error('Catégorie non trouvée');
    return response.json();
  }

  // 👑 ADMIN - Créer une catégorie
  async createCategory(categoryData) {
    const response = await fetch(`${this.baseURL}/admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAdminToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur création catégorie');
    }
    
    return response.json();
  }

  // 👑 ADMIN - Lister toutes les catégories
  async getCategories(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.search) queryParams.append('search', params.search);

    const response = await fetch(`${this.baseURL}/admin?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${this.getAdminToken()}` }
    });
    
    if (!response.ok) throw new Error('Erreur récupération catégories');
    return response.json();
  }

  // 👑 ADMIN - Récupérer une catégorie par ID
  async getCategoryById(id) {
    const response = await fetch(`${this.baseURL}/admin/${id}`, {
      headers: { 'Authorization': `Bearer ${this.getAdminToken()}` }
    });
    
    if (!response.ok) throw new Error('Catégorie non trouvée');
    return response.json();
  }

  // 👑 ADMIN - Modifier une catégorie
  async updateCategory(id, updateData) {
    const response = await fetch(`${this.baseURL}/admin/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getAdminToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur modification catégorie');
    }
    
    return response.json();
  }

  // 👑 ADMIN - Supprimer une catégorie
  async deleteCategory(id) {
    const response = await fetch(`${this.baseURL}/admin/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.getAdminToken()}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur suppression catégorie');
    }
    
    return response.json();
  }
}

export const designCategoryService = new DesignCategoryService();
```

---

## ⚛️ **Exemples React**

### 🎨 **Sélecteur de Catégorie (Vendeurs)**

```jsx
import { useState, useEffect } from 'react';
import { designCategoryService } from './designCategoryService';

function CategorySelector({ selectedCategoryId, onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadActiveCategories();
  }, []);

  const loadActiveCategories = async () => {
    try {
      const activeCategories = await designCategoryService.getActiveCategories();
      setCategories(activeCategories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement des catégories...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div className="category-selector">
      <label htmlFor="category">Catégorie de design *</label>
      <select
        id="category"
        value={selectedCategoryId || ''}
        onChange={(e) => onCategoryChange(parseInt(e.target.value))}
        required
      >
        <option value="">-- Sélectionner une catégorie --</option>
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {category.icon} {category.name}
          </option>
        ))}
      </select>
      
      {/* Affichage stylé avec couleurs et icônes */}
      <div className="category-grid">
        {categories.map(category => (
          <button
            key={category.id}
            type="button"
            className={`category-card ${selectedCategoryId === category.id ? 'selected' : ''}`}
            style={{ borderColor: category.color }}
            onClick={() => onCategoryChange(category.id)}
          >
            <div className="category-icon">{category.icon}</div>
            <div className="category-name">{category.name}</div>
            <div className="category-count">{category.designCount} designs</div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 👑 **Gestion Admin des Catégories**

```jsx
import { useState, useEffect } from 'react';
import { designCategoryService } from './designCategoryService';

function AdminCategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#FF5722',
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const result = await designCategoryService.getCategories();
      setCategories(result.categories);
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await designCategoryService.updateCategory(editingCategory.id, formData);
        alert('Catégorie modifiée avec succès');
      } else {
        await designCategoryService.createCategory(formData);
        alert('Catégorie créée avec succès');
      }
      
      setShowForm(false);
      setEditingCategory(null);
      resetForm();
      loadCategories();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#FF5722',
      isActive: category.isActive,
      sortOrder: category.sortOrder
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Supprimer la catégorie "${name}" ?`)) return;
    
    try {
      await designCategoryService.deleteCategory(id);
      alert('Catégorie supprimée');
      loadCategories();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '#FF5722',
      isActive: true,
      sortOrder: 0
    });
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="admin-categories">
      <div className="header">
        <h2>🎨 Gestion des Catégories de Design</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Nouvelle Catégorie
        </button>
      </div>

      {/* Liste des catégories */}
      <div className="categories-list">
        {categories.map(category => (
          <div key={category.id} className="category-item">
            <div className="category-info">
              <span className="icon">{category.icon}</span>
              <div>
                <h4 style={{ color: category.color }}>{category.name}</h4>
                <p>{category.description}</p>
                <small>
                  {category.designCount} designs • 
                  {category.isActive ? ' Actif' : ' Inactif'} • 
                  Ordre: {category.sortOrder}
                </small>
              </div>
            </div>
            <div className="category-actions">
              <button onClick={() => handleEdit(category)}>✏️ Modifier</button>
              <button 
                onClick={() => handleDelete(category.id, category.name)}
                className="btn-danger"
                disabled={category.designCount > 0}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire de création/modification */}
      {showForm && (
        <div className="modal">
          <form onSubmit={handleSubmit} className="category-form">
            <h3>{editingCategory ? 'Modifier' : 'Créer'} une catégorie</h3>
            
            <div className="form-grid">
              <div>
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label>Icône (emoji ou texte)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  placeholder="🎨"
                />
              </div>
              
              <div>
                <label>Couleur</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </div>
              
              <div>
                <label>Ordre d'affichage</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value)})}
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
              />
            </div>
            
            <div className="checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                />
                Catégorie active
              </label>
            </div>
            
            <div className="form-actions">
              <button type="submit">
                {editingCategory ? 'Modifier' : 'Créer'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                  resetForm();
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 **Modification du Formulaire de Design**

**Important :** Les vendeurs doivent maintenant utiliser `categoryId` au lieu de l'ancienne enum :

```javascript
// ❌ ANCIENNE VERSION
const designData = {
  name: "Mon logo",
  price: 2500,
  category: "logo"  // Enum fixe
};

// ✅ NOUVELLE VERSION
const designData = {
  name: "Mon logo", 
  price: 2500,
  categoryId: 1     // ID de la catégorie sélectionnée
};
```

---

## 📊 **Réponses API**

### ✅ **Succès - Liste des catégories actives**
```json
[
  {
    "id": 1,
    "name": "Logo Design",
    "description": "Logos et identités visuelles",
    "slug": "logo-design",
    "icon": "🎨",
    "color": "#FF5722",
    "isActive": true,
    "sortOrder": 10,
    "designCount": 25,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "creator": {
      "id": 1,
      "firstName": "Admin",
      "lastName": "User"
    }
  }
]
```

### ✅ **Succès - Liste admin avec pagination**
```json
{
  "categories": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

### ❌ **Erreurs**
```json
// 409 - Nom ou slug déjà utilisé
{"message": "Une catégorie avec ce nom existe déjà"}

// 400 - Impossible de supprimer (designs liés)
{"message": "Impossible de supprimer cette catégorie car elle contient 15 design(s)"}

// 404 - Catégorie non trouvée
{"message": "Catégorie non trouvée"}
```

---

## ⚡ **Points Importants**

1. **🔄 Migration automatique** : Les anciens designs peuvent ne pas avoir de categoryId (null)
2. **🛡️ Sécurité** : Seuls les admins peuvent créer/modifier les catégories
3. **🔗 Liaisons** : Impossible de supprimer une catégorie contenant des designs
4. **🎨 Slug unique** : Généré automatiquement pour URLs SEO-friendly
5. **📱 Responsive** : Les couleurs et icônes permettent un affichage attrayant
6. **⚡ Performance** : Pagination et filtres pour grandes listes

---

## 🚀 **Test Rapide**

```bash
# Récupérer les catégories actives (public)
curl https://api.example.com/design-categories/active

# Créer une catégorie (admin)
curl -X POST \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Illustration","icon":"🖼️","color":"#2196F3"}' \
  https://api.example.com/design-categories/admin
```

---

**🎯 Les catégories de design sont maintenant entièrement dynamiques !**