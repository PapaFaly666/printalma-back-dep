# 📖 Guide Simple - Catégories de Design Frontend

## 🎯 **En bref**

Les admins créent des catégories de design dynamiques. Les vendeurs les utilisent quand ils créent leurs designs.

---

## 🔗 **Endpoints Essentiels**

### Pour les Vendeurs (Public)
```
GET /design-categories/active    → Liste des catégories disponibles
```

### Pour les Admins
```
POST /design-categories/admin    → Créer une catégorie
GET  /design-categories/admin    → Toutes les catégories
PUT  /design-categories/admin/1  → Modifier catégorie ID 1
DELETE /design-categories/admin/1 → Supprimer catégorie ID 1
```

---

## 💻 **Code JavaScript Simple**

```javascript
// Récupérer les catégories pour les vendeurs
async function getDesignCategories() {
  const response = await fetch('/design-categories/active');
  return response.json();
}

// Créer une catégorie (admin seulement)
async function createCategory(adminToken, categoryData) {
  const response = await fetch('/design-categories/admin', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}
```

---

## 📝 **Données d'une Catégorie**

```javascript
{
  "id": 1,
  "name": "Logo Design",           // Nom affiché
  "description": "Logos et...",    // Description optionnelle
  "slug": "logo-design",           // Pour URLs
  "coverImageUrl": "https://res.cloudinary.com/printalma/image/upload/v123/cover.jpg", // Image de couverture
  "isActive": true,                // Visible ou non
  "sortOrder": 10,                 // Ordre d'affichage
  "designCount": 25,               // Nb de designs dans cette catégorie
  "createdAt": "2024-01-15...",
  "updatedAt": "2024-01-15...",
  "creator": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User"
  }
}
```

---

## ⚛️ **Composant React - Sélecteur pour Vendeurs**

```jsx
import { useState, useEffect } from 'react';

function CategorySelector({ value, onChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/design-categories/active')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <label>Catégorie de design *</label>
      <select value={value || ''} onChange={e => onChange(parseInt(e.target.value))} required>
        <option value="">-- Choisir une catégorie --</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.name} ({cat.designCount})
          </option>
        ))}
      </select>
    </div>
  );
}

// Utilisation
function CreateDesignForm() {
  const [categoryId, setCategoryId] = useState(null);
  
  return (
    <form>
      <CategorySelector 
        value={categoryId} 
        onChange={setCategoryId} 
      />
      {/* autres champs... */}
    </form>
  );
}
```

---

## 👑 **Composant React - Gestion Admin**

```jsx
import { useState, useEffect } from 'react';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coverImage: null
  });

  const adminToken = localStorage.getItem('admin_token');

  const loadCategories = async () => {
    try {
      const response = await fetch('/design-categories/admin', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const result = await response.json();
      setCategories(result.categories);
    } catch (err) {
      alert('Erreur chargement: ' + err.message);
    }
  };

  const createCategory = async () => {
    try {
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      if (formData.description) formDataObj.append('description', formData.description);
      if (formData.coverImage) formDataObj.append('coverImage', formData.coverImage);
      
      await fetch('/design-categories/admin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
          // Ne pas définir Content-Type pour multipart/form-data
        },
        body: formDataObj
      });
      
      alert('Catégorie créée !');
      setShowForm(false);
      setFormData({ name: '', description: '', coverImage: null });
      loadCategories();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const deleteCategory = async (id, name) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    
    try {
      await fetch(`/design-categories/admin/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      alert('Supprimée !');
      loadCategories();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  return (
    <div>
      <h2>🎨 Catégories de Design</h2>
      
      <button onClick={() => setShowForm(true)}>
        + Nouvelle Catégorie
      </button>

      {/* Liste */}
      {categories.map(cat => (
        <div key={cat.id} style={{ 
          border: '1px solid #ddd', 
          margin: '10px 0', 
          padding: '10px'
        }}>
          {cat.coverImageUrl && (
            <img 
              src={cat.coverImageUrl} 
              alt={cat.name}
              style={{ width: '100px', height: '75px', objectFit: 'cover', marginBottom: '10px' }}
            />
          )}
          <h4>
            {cat.name} 
            <small>({cat.designCount} designs)</small>
          </h4>
          <p>{cat.description}</p>
          <button onClick={() => deleteCategory(cat.id, cat.name)}>
            🗑️ Supprimer
          </button>
        </div>
      ))}

      {/* Formulaire de création */}
      {showForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            width: '400px'
          }}>
            <h3>Nouvelle Catégorie</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label>Nom *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', padding: '8px' }}
                placeholder="Logo Design"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                style={{ width: '100%', padding: '8px' }}
                placeholder="Pour les logos et identités..."
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Image de couverture</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setFormData({...formData, coverImage: e.target.files[0]})}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div>
              <button 
                onClick={createCategory}
                style={{ 
                  background: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 20px', 
                  marginRight: '10px' 
                }}
              >
                Créer
              </button>
              <button onClick={() => setShowForm(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 **Modification du Design Form**

**IMPORTANT :** Changement pour les vendeurs qui créent des designs :

```javascript
// ❌ AVANT (ne marche plus)
const designData = {
  name: "Mon super logo",
  price: 5000,
  category: "logo"  // Ancienne enum
};

// ✅ MAINTENANT (obligatoire)
const designData = {
  name: "Mon super logo", 
  price: 5000,
  categoryId: 1     // ID de la catégorie sélectionnée
};
```

---

## 📋 **Champs pour Créer une Catégorie**

| Champ | Type | Requis | Exemple |
|-------|------|--------|---------|
| `name` | string | ✅ | "Logo Design" |
| `description` | string | ❌ | "Pour les logos..." |
| `coverImage` | file | ❌ | image.jpg |
| `isActive` | boolean | ❌ | true (par défaut) |
| `sortOrder` | number | ❌ | 0 (par défaut) |

---

## 🚨 **Gestion des Erreurs**

```javascript
// Erreurs courantes à gérer
try {
  await createCategory(data);
} catch (error) {
  if (error.message.includes('existe déjà')) {
    alert('Ce nom de catégorie est déjà pris');
  } else if (error.message.includes('designs')) {
    alert('Impossible de supprimer, il y a des designs liés');
  } else {
    alert('Erreur: ' + error.message);
  }
}
```

---

## ✅ **Checklist d'Implémentation**

### Pour l'Interface Vendeur
- [ ] Remplacer l'ancien sélecteur de catégorie fixe
- [ ] Utiliser `/design-categories/active` pour charger les options
- [ ] Passer `categoryId` (nombre) au lieu de `category` (string)
- [ ] Afficher icône + nom dans le sélecteur
- [ ] Gérer le cas "aucune catégorie disponible"

### Pour l'Interface Admin  
- [ ] Créer la page de gestion des catégories
- [ ] Formulaire création avec : nom, description, icône, couleur
- [ ] Liste avec actions modifier/supprimer
- [ ] Gestion d'erreur "impossible de supprimer si designs liés"
- [ ] Token admin dans tous les appels

---

## 🔧 **Tests Rapides**

```bash
# Tester récupération catégories (public)
curl https://votreapi.com/design-categories/active

# Tester création catégorie (admin) avec image
curl -X POST https://votreapi.com/design-categories/admin \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN" \
  -F 'name=Test Category' \
  -F 'description=Test description' \
  -F 'coverImage=@/path/to/image.jpg'
```

---

**🎯 C'est tout ! Système de catégories prêt à implémenter.**