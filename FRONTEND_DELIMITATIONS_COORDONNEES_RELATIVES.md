# 🎯 Documentation Frontend - Délimitations avec Coordonnées Relatives

## 📋 Vue d'ensemble

Le nouveau système de délimitations utilise des **coordonnées relatives en pourcentages** (0-100%) au lieu de coordonnées absolues en pixels. Cela garantit un positionnement précis et cohérent sur tous les appareils et tailles d'écran.

## 🔄 Changements par rapport à l'ancien système

### **Avant (Coordonnées absolues)**
```javascript
{
  x: 734,        // pixels absolus
  y: 410,        // pixels absolus  
  width: 489,    // pixels absolus
  height: 364    // pixels absolus
}
```

### **Maintenant (Coordonnées relatives)**
```javascript
{
  x: 48.93,      // pourcentage (0-100%)
  y: 51.25,      // pourcentage (0-100%)
  width: 32.6,   // pourcentage (0-100%)
  height: 45.5,  // pourcentage (0-100%)
  coordinateType: "PERCENTAGE"
}
```

## 🚀 Nouveaux Endpoints API

### **Base URL :** `http://localhost:3000/api/delimitations`

---

## 📍 1. Créer une délimitation

**`POST /api/delimitations`**

```javascript
const response = await fetch('/api/delimitations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    productImageId: 12,
    delimitation: {
      x: 25.5,          // 25.5% depuis la gauche
      y: 30.0,          // 30% depuis le haut
      width: 40.0,      // 40% de largeur
      height: 25.0,     // 25% de hauteur
      rotation: 0,      // rotation en degrés (optionnel)
      name: "Zone Poitrine", // nom de la zone (optionnel)
      coordinateType: "PERCENTAGE" // toujours PERCENTAGE pour nouvelles
    }
  })
});

const result = await response.json();
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "x": 25.5,
    "y": 30.0,
    "width": 40.0,
    "height": 25.0,
    "rotation": 0,
    "name": "Zone Poitrine",
    "coordinateType": "PERCENTAGE",
    "productImageId": 12,
    "createdAt": "2025-01-10T11:45:30.000Z",
    "updatedAt": "2025-01-10T11:45:30.000Z"
  },
  "message": "Délimitation créée avec succès"
}
```

---

## 📍 2. Récupérer les délimitations d'une image

**`GET /api/delimitations/image/:imageId`**

```javascript
const imageId = 12;
const response = await fetch(`/api/delimitations/image/${imageId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "x": 25.5,
      "y": 30.0,
      "width": 40.0,
      "height": 25.0,
      "rotation": 0,
      "name": "Zone Poitrine",
      "coordinateType": "PERCENTAGE",
      "productImageId": 12,
      "createdAt": "2025-01-10T11:45:30.000Z"
    },
    {
      "id": 16,
      "x": 60.0,
      "y": 70.0,
      "width": 30.0,
      "height": 20.0,
      "rotation": 45,
      "name": "Logo Dos",
      "coordinateType": "PERCENTAGE",
      "productImageId": 12,
      "createdAt": "2025-01-10T11:50:15.000Z"
    }
  ],
  "count": 2
}
```

---

## 📍 3. Modifier une délimitation

**`PUT /api/delimitations/:id`**

```javascript
const delimitationId = 15;
const response = await fetch(`/api/delimitations/${delimitationId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    x: 30.0,        // nouvelle position
    y: 35.0,
    width: 45.0,    // nouvelle taille
    height: 30.0,
    rotation: 15,   // nouvelle rotation
    name: "Zone Poitrine Élargie"
  })
});
```

---

## 📍 4. Supprimer une délimitation

**`DELETE /api/delimitations/:id`**

```javascript
const delimitationId = 15;
const response = await fetch(`/api/delimitations/${delimitationId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📍 5. Statistiques des délimitations

**`GET /api/delimitations/stats`**

```javascript
const response = await fetch('/api/delimitations/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const stats = await response.json();
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "percentage": 18,    // délimitations en pourcentages
    "absolute": 7,       // délimitations en pixels (anciennes)
    "migrationProgress": 72  // 72% migrées
  }
}
```

---

## 🎨 Interface Frontend - Conversion et Affichage

### **1. Afficher une délimitation sur une image**

```javascript
function displayDelimitation(delimitation, imageElement) {
  const { x, y, width, height, rotation, name } = delimitation;
  
  // Créer l'élément de délimitation
  const delimitationDiv = document.createElement('div');
  delimitationDiv.className = 'delimitation-zone';
  delimitationDiv.style.position = 'absolute';
  
  // Appliquer les coordonnées en pourcentages
  delimitationDiv.style.left = `${x}%`;
  delimitationDiv.style.top = `${y}%`;
  delimitationDiv.style.width = `${width}%`;
  delimitationDiv.style.height = `${height}%`;
  
  // Appliquer la rotation si nécessaire
  if (rotation) {
    delimitationDiv.style.transform = `rotate(${rotation}deg)`;
  }
  
  // Style visuel
  delimitationDiv.style.border = '2px dashed #007bff';
  delimitationDiv.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
  delimitationDiv.style.cursor = 'move';
  
  // Ajouter le nom si disponible
  if (name) {
    delimitationDiv.title = name;
    const label = document.createElement('span');
    label.textContent = name;
    label.style.position = 'absolute';
    label.style.top = '-25px';
    label.style.left = '0';
    label.style.background = '#007bff';
    label.style.color = 'white';
    label.style.padding = '2px 8px';
    label.style.borderRadius = '3px';
    label.style.fontSize = '12px';
    delimitationDiv.appendChild(label);
  }
  
  // Ajouter au conteneur de l'image
  const imageContainer = imageElement.parentElement;
  imageContainer.style.position = 'relative';
  imageContainer.appendChild(delimitationDiv);
  
  return delimitationDiv;
}
```

### **2. Créer une délimitation interactive**

```javascript
function createInteractiveDelimitation(imageContainer, imageId) {
  let isDrawing = false;
  let startX, startY;
  
  imageContainer.addEventListener('mousedown', (e) => {
    if (e.target !== imageContainer.querySelector('img')) return;
    
    isDrawing = true;
    const rect = imageContainer.getBoundingClientRect();
    startX = ((e.clientX - rect.left) / rect.width) * 100;
    startY = ((e.clientY - rect.top) / rect.height) * 100;
  });
  
  imageContainer.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    
    const rect = imageContainer.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Créer ou mettre à jour l'aperçu de la délimitation
    let preview = imageContainer.querySelector('.delimitation-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.className = 'delimitation-preview';
      preview.style.position = 'absolute';
      preview.style.border = '2px dashed #28a745';
      preview.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
      preview.style.pointerEvents = 'none';
      imageContainer.appendChild(preview);
    }
    
    // Calculer position et taille
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    preview.style.left = `${x}%`;
    preview.style.top = `${y}%`;
    preview.style.width = `${width}%`;
    preview.style.height = `${height}%`;
  });
  
  imageContainer.addEventListener('mouseup', async (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    
    const preview = imageContainer.querySelector('.delimitation-preview');
    if (!preview) return;
    
    // Récupérer les coordonnées finales
    const x = parseFloat(preview.style.left.replace('%', ''));
    const y = parseFloat(preview.style.top.replace('%', ''));
    const width = parseFloat(preview.style.width.replace('%', ''));
    const height = parseFloat(preview.style.height.replace('%', ''));
    
    // Supprimer l'aperçu
    preview.remove();
    
    // Valider la taille minimale
    if (width < 1 || height < 1) {
      alert('La délimitation est trop petite');
      return;
    }
    
    // Demander un nom pour la délimitation
    const name = prompt('Nom de la zone de délimitation (optionnel):');
    
    // Créer la délimitation via l'API
    try {
      const response = await fetch('/api/delimitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productImageId: imageId,
          delimitation: {
            x: Math.round(x * 100) / 100,
            y: Math.round(y * 100) / 100,
            width: Math.round(width * 100) / 100,
            height: Math.round(height * 100) / 100,
            rotation: 0,
            name: name || undefined,
            coordinateType: "PERCENTAGE"
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Afficher la nouvelle délimitation
        displayDelimitation(result.data, imageContainer.querySelector('img'));
        alert('Délimitation créée avec succès !');
      } else {
        alert(`Erreur: ${result.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de la délimitation');
    }
  });
}
```

### **3. Utilitaires de conversion**

```javascript
// Convertir coordonnées absolues vers pourcentages
async function convertToPercentage(absoluteCoords, imageSize) {
  const response = await fetch('/api/delimitations/convert/to-percentage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      x: absoluteCoords.x,
      y: absoluteCoords.y,
      width: absoluteCoords.width,
      height: absoluteCoords.height,
      imageWidth: imageSize.width,
      imageHeight: imageSize.height
    })
  });
  
  return await response.json();
}

// Convertir coordonnées pourcentages vers absolues (pour debug/calculs)
async function convertToAbsolute(percentageCoords, imageSize) {
  const response = await fetch('/api/delimitations/convert/to-absolute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      x: percentageCoords.x,
      y: percentageCoords.y,
      width: percentageCoords.width,
      height: percentageCoords.height,
      imageWidth: imageSize.width,
      imageHeight: imageSize.height
    })
  });
  
  return await response.json();
}
```

---

## ✅ Validation Frontend

### **Contraintes à respecter :**

```javascript
function validateDelimitation(delimitation) {
  const errors = [];
  
  // Coordonnées positives
  if (delimitation.x < 0) errors.push('X doit être >= 0');
  if (delimitation.y < 0) errors.push('Y doit être >= 0');
  
  // Taille minimale
  if (delimitation.width < 0.1) errors.push('Largeur minimale: 0.1%');
  if (delimitation.height < 0.1) errors.push('Hauteur minimale: 0.1%');
  
  // Limites maximales
  if (delimitation.x > 100) errors.push('X ne peut pas dépasser 100%');
  if (delimitation.y > 100) errors.push('Y ne peut pas dépasser 100%');
  if (delimitation.width > 100) errors.push('Largeur ne peut pas dépasser 100%');
  if (delimitation.height > 100) errors.push('Hauteur ne peut pas dépasser 100%');
  
  // Zone dans les limites
  if (delimitation.x + delimitation.width > 100) {
    errors.push('La zone dépasse les limites horizontales');
  }
  if (delimitation.y + delimitation.height > 100) {
    errors.push('La zone dépasse les limites verticales');
  }
  
  // Rotation
  if (delimitation.rotation < -180 || delimitation.rotation > 180) {
    errors.push('Rotation doit être entre -180° et 180°');
  }
  
  return errors;
}
```

---

## 🔧 Migration des données existantes

### **Migrer les délimitations d'un produit :**

```javascript
async function migrateProductDelimitations(productId) {
  const response = await fetch(`/api/delimitations/migrate/product/${productId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  console.log(`Migration: ${result.data.success} succès, ${result.data.errors} erreurs`);
  return result;
}
```

---

## 🎯 Bonnes Pratiques

### **1. Responsive Design**
```css
.image-container {
  position: relative;
  width: 100%;
  max-width: 600px;
}

.image-container img {
  width: 100%;
  height: auto;
  display: block;
}

.delimitation-zone {
  position: absolute;
  /* Les pourcentages s'adaptent automatiquement */
}
```

### **2. Gestion d'erreurs**
```javascript
async function safeApiCall(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur API');
    }
    
    return data;
  } catch (error) {
    console.error('Erreur API:', error);
    // Afficher notification d'erreur à l'utilisateur
    showErrorNotification(error.message);
    throw error;
  }
}
```

### **3. Debounce pour les modifications**
```javascript
function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const debouncedUpdate = debounce(async (id, data) => {
  await fetch(`/api/delimitations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
}, 500);
```

---

## 🚀 Exemple d'intégration complète

```html
<!DOCTYPE html>
<html>
<head>
  <title>Délimitations Interactives</title>
  <style>
    .image-container {
      position: relative;
      display: inline-block;
      border: 2px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .delimitation-zone {
      position: absolute;
      border: 2px dashed #007bff;
      background: rgba(0, 123, 255, 0.1);
      cursor: move;
      user-select: none;
    }
    
    .delimitation-zone:hover {
      border-color: #0056b3;
      background: rgba(0, 123, 255, 0.2);
    }
    
    .delimitation-label {
      position: absolute;
      top: -25px;
      left: 0;
      background: #007bff;
      color: white;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 12px;
      white-space: nowrap;
    }
    
    .controls {
      margin: 20px 0;
    }
    
    .btn {
      padding: 8px 16px;
      margin: 0 5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .btn-primary { background: #007bff; color: white; }
    .btn-success { background: #28a745; color: white; }
    .btn-danger { background: #dc3545; color: white; }
    
    .stats {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <h1>🎯 Gestionnaire de Délimitations</h1>
  
  <div class="controls">
    <button class="btn btn-primary" onclick="loadImage()">Charger Image</button>
    <button class="btn btn-success" onclick="enableDrawing()">Mode Création</button>
    <button class="btn btn-danger" onclick="clearDelimitations()">Effacer Tout</button>
    <button class="btn btn-primary" onclick="loadStats()">Statistiques</button>
  </div>
  
  <div id="stats" class="stats" style="display: none;">
    <h3>📊 Statistiques</h3>
    <div id="stats-content"></div>
  </div>
  
  <div class="image-container" id="imageContainer">
    <img id="productImage" src="https://via.placeholder.com/600x400" alt="Produit">
  </div>
  
  <div id="delimitations-list">
    <h3>📋 Délimitations</h3>
    <div id="delimitations-content"></div>
  </div>

  <script>
    const API_BASE = 'http://localhost:3000/api';
    const imageId = 12; // ID de l'image en cours
    
    // Charger et afficher les délimitations existantes
    async function loadDelimitations() {
      try {
        const response = await fetch(`${API_BASE}/delimitations/image/${imageId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Effacer les délimitations existantes
          document.querySelectorAll('.delimitation-zone').forEach(el => el.remove());
          
          // Afficher chaque délimitation
          const img = document.getElementById('productImage');
          result.data.forEach(delimitation => {
            displayDelimitation(delimitation, img);
          });
          
          // Mettre à jour la liste
          updateDelimitationsList(result.data);
        }
      } catch (error) {
        console.error('Erreur chargement délimitations:', error);
      }
    }
    
    function updateDelimitationsList(delimitations) {
      const content = document.getElementById('delimitations-content');
      content.innerHTML = delimitations.map(d => `
        <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          <strong>${d.name || `Délimitation ${d.id}`}</strong><br>
          Position: ${d.x.toFixed(1)}%, ${d.y.toFixed(1)}%<br>
          Taille: ${d.width.toFixed(1)}% × ${d.height.toFixed(1)}%<br>
          <button onclick="deleteDelimitation(${d.id})" class="btn btn-danger" style="margin-top: 5px;">Supprimer</button>
        </div>
      `).join('');
    }
    
    async function deleteDelimitation(id) {
      if (!confirm('Supprimer cette délimitation ?')) return;
      
      try {
        const response = await fetch(`${API_BASE}/delimitations/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const result = await response.json();
        if (result.success) {
          loadDelimitations(); // Recharger
        }
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
    
    async function loadStats() {
      try {
        const response = await fetch(`${API_BASE}/delimitations/stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          const statsDiv = document.getElementById('stats');
          const content = document.getElementById('stats-content');
          
          content.innerHTML = `
            <p><strong>Total:</strong> ${result.data.total} délimitations</p>
            <p><strong>En pourcentages:</strong> ${result.data.percentage}</p>
            <p><strong>En pixels (anciennes):</strong> ${result.data.absolute}</p>
            <p><strong>Progression migration:</strong> ${result.data.migrationProgress}%</p>
          `;
          
          statsDiv.style.display = 'block';
        }
      } catch (error) {
        console.error('Erreur stats:', error);
      }
    }
    
    function enableDrawing() {
      const container = document.getElementById('imageContainer');
      createInteractiveDelimitation(container, imageId);
      alert('Mode création activé. Cliquez et glissez sur l\'image pour créer une délimitation.');
    }
    
    function clearDelimitations() {
      if (!confirm('Supprimer toutes les délimitations ?')) return;
      document.querySelectorAll('.delimitation-zone').forEach(el => el.remove());
    }
    
    // Charger au démarrage
    window.addEventListener('load', () => {
      loadDelimitations();
    });
    
    // Inclure ici les fonctions displayDelimitation et createInteractiveDelimitation
    // du code précédent...
  </script>
</body>
</html>
```

---

## 🎯 Résumé pour les développeurs

### **Points clés à retenir :**

1. **Toujours utiliser des pourcentages** pour les nouvelles délimitations
2. **Valider les coordonnées** avant envoi (0-100%, zones dans limites)
3. **Gérer les erreurs** de l'API proprement
4. **Utiliser les utilitaires** de conversion pour la migration
5. **Tester sur différentes tailles** d'écran pour vérifier la responsivité

### **Support et migration :**
- Les anciennes délimitations en pixels continuent de fonctionner
- Utiliser `/api/delimitations/migrate/product/:id` pour migrer
- Consulter `/api/delimitations/stats` pour suivre la progression

Cette documentation fournit tout ce qu'il faut pour intégrer le nouveau système de délimitations avec coordonnées relatives ! 🚀 