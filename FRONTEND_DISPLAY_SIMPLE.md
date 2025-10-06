# 🎯 Guide Rapide - Afficher les catégories avec variations

## ⚠️ IMPORTANT : Utilisez le bon endpoint

```javascript
// ✅ BON ENDPOINT pour affichage
const categories = await fetch('http://localhost:3004/categories/hierarchy').then(r => r.json());

// ❌ NE PAS UTILISER (liste plate)
const categories = await fetch('http://localhost:3004/categories').then(r => r.json());
```

---

## 📋 Structure des données retournées

```json
[
  {
    "id": 1,
    "name": "Telephone",
    "level": 0,
    "productCount": 0,
    "subcategories": [
      {
        "id": 2,
        "name": "coque",
        "level": 1,
        "productCount": 0,
        "subcategories": [
          {
            "id": 3,
            "name": "iphone 11",
            "level": 2,
            "productCount": 0,
            "subcategories": []
          }
        ]
      }
    ]
  }
]
```

**Point clé :** Chaque catégorie a un champ `subcategories` qui contient ses enfants.

---

## 🖥️ Code JavaScript simple

```javascript
// 1. Charger les données
async function loadCategories() {
  const response = await fetch('http://localhost:3004/categories/hierarchy');
  const categories = await response.json();

  console.log('Catégories chargées:', categories);
  displayCategories(categories);
}

// 2. Afficher dans la console (debug)
function displayCategories(categories) {
  categories.forEach(parent => {
    console.log(`📁 ${parent.name}`); // Level 0

    parent.subcategories?.forEach(child => {
      console.log(`  📂 ${child.name}`); // Level 1

      child.subcategories?.forEach(variation => {
        console.log(`    📄 ${variation.name}`); // Level 2
      });
    });
  });
}

// 3. Charger au démarrage
loadCategories();
```

**Résultat dans la console :**
```
📁 Telephone
  📂 coque
    📄 iphone 11
📁 teleph
  📂 grdrgd
    📄 rger
    📄 uryur
```

---

## 🎨 Affichage HTML avec Vanilla JS

```html
<!DOCTYPE html>
<html>
<head>
  <title>Catégories</title>
  <style>
    .category-tree {
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    .level-0 {
      font-weight: bold;
      font-size: 18px;
      margin: 10px 0;
      color: #333;
    }
    .level-1 {
      margin-left: 20px;
      font-size: 16px;
      color: #555;
    }
    .level-2 {
      margin-left: 40px;
      font-size: 14px;
      color: #777;
    }
  </style>
</head>
<body>
  <div id="categories" class="category-tree"></div>

  <script>
    async function loadCategories() {
      try {
        const response = await fetch('http://localhost:3004/categories/hierarchy');
        const categories = await response.json();

        const container = document.getElementById('categories');
        container.innerHTML = renderCategories(categories);
      } catch (error) {
        console.error('Erreur:', error);
      }
    }

    function renderCategories(categories) {
      let html = '';

      categories.forEach(parent => {
        html += `<div class="level-0">📁 ${parent.name} (${parent.productCount})</div>`;

        parent.subcategories?.forEach(child => {
          html += `<div class="level-1">📂 ${child.name} (${child.productCount})</div>`;

          child.subcategories?.forEach(variation => {
            html += `<div class="level-2">📄 ${variation.name} (${variation.productCount})</div>`;
          });
        });
      });

      return html;
    }

    // Charger au démarrage
    loadCategories();
  </script>
</body>
</html>
```

---

## ⚛️ Composant React

```jsx
import React, { useState, useEffect } from 'react';

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les catégories
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const response = await fetch('http://localhost:3004/categories/hierarchy');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Catégories</h2>
      <button onClick={loadCategories}>🔄 Rafraîchir</button>

      {categories.map(parent => (
        <div key={parent.id} style={{ marginBottom: '20px' }}>
          {/* Parent - Level 0 */}
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
            📁 {parent.name} ({parent.productCount} produits)
          </div>

          {/* Enfants - Level 1 */}
          {parent.subcategories?.map(child => (
            <div key={child.id} style={{ marginLeft: '20px' }}>
              <div style={{ fontSize: '16px', color: '#555' }}>
                📂 {child.name} ({child.productCount} produits)
              </div>

              {/* Variations - Level 2 */}
              {child.subcategories?.map(variation => (
                <div
                  key={variation.id}
                  style={{ marginLeft: '40px', fontSize: '14px', color: '#777' }}
                >
                  📄 {variation.name} ({variation.productCount} produits)
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default CategoryList;
```

---

## 🔄 Rafraîchir après création

**IMPORTANT :** Après avoir créé des catégories, vous devez recharger la liste :

```javascript
// Créer une structure
async function createCategory(data) {
  const response = await fetch('http://localhost:3004/categories/structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (result.success) {
    console.log(`✅ ${result.createdCount} éléments créés`);

    // ⚠️ IMPORTANT : Recharger les catégories
    await loadCategories();
  }
}

// Exemple d'utilisation
createCategory({
  parentName: 'Vêtements',
  childName: 'T-Shirt',
  variations: ['Homme', 'Femme', 'Enfant']
});
```

---

## 🧪 Test rapide dans la console

Ouvrez la console du navigateur (F12) et collez ce code :

```javascript
// Test 1: Vérifier que l'API fonctionne
fetch('http://localhost:3004/categories/hierarchy')
  .then(r => r.json())
  .then(data => console.log('✅ Données:', data));

// Test 2: Afficher l'arbre complet
fetch('http://localhost:3004/categories/hierarchy')
  .then(r => r.json())
  .then(categories => {
    categories.forEach(parent => {
      console.log(`📁 ${parent.name}`);
      parent.subcategories?.forEach(child => {
        console.log(`  📂 ${child.name}`);
        child.subcategories?.forEach(variation => {
          console.log(`    📄 ${variation.name}`);
        });
      });
    });
  });
```

---

## ✅ Checklist de vérification

Si les catégories ne s'affichent pas :

- [ ] **Utilisez `/hierarchy`** : `http://localhost:3004/categories/hierarchy`
- [ ] **Vérifiez la réponse** : Ouvrez Network dans les DevTools
- [ ] **Vérifiez `subcategories`** : Chaque catégorie doit avoir ce champ
- [ ] **Parcourez 3 niveaux** : parent → child → variation
- [ ] **Rechargez après création** : Appelez `loadCategories()` après chaque modification

---

## 📊 Données actuelles dans votre base

D'après le test de l'API, voici ce qui existe actuellement :

```
📁 Telephone (0 produits)
  📂 coque (0 produits)
    📄 iphone 11 (0 produits)

📁 teleph (0 produits)
  📂 grdrgd (0 produits)
    📄 rger (0 produits)
    📄 uryur (0 produits)
```

---

## 🎯 Exemple complet avec création + affichage

```javascript
// === PARTIE 1 : AFFICHAGE ===
async function loadAndDisplayCategories() {
  const response = await fetch('http://localhost:3004/categories/hierarchy');
  const categories = await response.json();

  const container = document.getElementById('categories');
  let html = '<h2>Catégories</h2>';

  categories.forEach(parent => {
    html += `
      <div style="margin: 10px 0;">
        <strong>📁 ${parent.name}</strong>
        <div style="margin-left: 20px;">
    `;

    parent.subcategories?.forEach(child => {
      html += `
        <div style="margin: 5px 0;">
          <strong>📂 ${child.name}</strong>
          <div style="margin-left: 20px;">
      `;

      child.subcategories?.forEach(variation => {
        html += `<div>📄 ${variation.name}</div>`;
      });

      html += '</div></div>';
    });

    html += '</div></div>';
  });

  container.innerHTML = html;
}

// === PARTIE 2 : CRÉATION ===
async function createNewCategory() {
  const data = {
    parentName: 'Accessoires',
    childName: 'Casquette',
    variations: ['Baseball', 'Snapback', 'Trucker']
  };

  const response = await fetch('http://localhost:3004/categories/structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (result.success) {
    alert(`✅ ${result.createdCount} éléments créés !`);

    // Recharger l'affichage
    await loadAndDisplayCategories();
  }
}

// Charger au démarrage
document.addEventListener('DOMContentLoaded', loadAndDisplayCategories);
```

---

## 📞 Aide supplémentaire

Si le problème persiste après avoir suivi ce guide :

1. **Testez l'API directement** : Ouvrez `http://localhost:3004/categories/hierarchy` dans votre navigateur
2. **Vérifiez la console** : Ouvrez F12 et regardez les erreurs
3. **Vérifiez Network** : Regardez si la requête est bien envoyée et la réponse reçue
4. **Testez le code de test** : Copiez le code de la section "Test rapide" dans la console

Le backend fonctionne correctement ✅ - si l'affichage ne marche pas, c'est probablement :
- Le mauvais endpoint (`/categories` au lieu de `/categories/hierarchy`)
- Oubli de parcourir `subcategories`
- Oubli de recharger après création
