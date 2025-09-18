# 🚀 SOLUTION RAPIDE - Erreur Validation Catégories

## ❌ **PROBLÈME**
```json
{
  "message": [
    "L'ID de la catégorie doit être supérieur à 0",
    "L'ID de la catégorie doit être un nombre entier",
    "La catégorie est requise"
  ]
}
```

## ✅ **SOLUTION EN 3 ÉTAPES**

### **1. Récupérer les catégories disponibles**
```bash
curl -X GET http://localhost:3004/design-categories/active
```

### **2. Code Frontend - Mapper nom → ID**
```javascript
// ✅ Ajouter cette fonction dans votre designService.js

const CATEGORY_MAPPING = {
    'Mangas': 5,
    'ILLUSTRATION': 1,
    'LOGO': 2,
    'PATTERN': 3,
    'TYPOGRAPHY': 4,
    'ABSTRACT': 6
};

const getCategoryId = (categoryName) => {
    const id = CATEGORY_MAPPING[categoryName];
    if (!id) {
        console.warn(`⚠️ Catégorie "${categoryName}" inconnue, utilisation de ID=1`);
        return 1; // Fallback vers première catégorie
    }
    console.log(`🏷️ ${categoryName} → ID ${id}`);
    return id;
};

// ✅ Modifier votre fonction de création
const createDesign = async (designData) => {
    const formData = new FormData();
    formData.append('file', designData.fileBlob);
    formData.append('name', designData.name);
    formData.append('price', designData.price.toString());
    formData.append('categoryId', getCategoryId(designData.category).toString()); // ⚡ CHANGEMENT ICI

    // Autres champs...
    if (designData.description) {
        formData.append('description', designData.description);
    }

    const response = await fetch('http://localhost:3004/api/designs', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur: ${JSON.stringify(error)}`);
    }

    return response.json();
};
```

### **3. Test rapide**
```javascript
// ✅ Tester le mapping
console.log('Test mapping:');
console.log('Mangas →', getCategoryId('Mangas')); // Doit retourner 5
console.log('LOGO →', getCategoryId('LOGO'));     // Doit retourner 2
```

## 🎯 **CHANGEMENT PRINCIPAL**

**AVANT :**
```javascript
formData.append('category', 'Mangas'); // ❌ String rejetée
```

**APRÈS :**
```javascript
formData.append('categoryId', '5'); // ✅ ID numérique accepté
```

## 📋 **ENDPOINTS DISPONIBLES**

- `GET /design-categories/active` - Récupérer les catégories (PUBLIC)
- `POST /api/designs` - Créer design avec `categoryId` numérique
- `POST /vendor/designs` - Créer design avec `category` string (fallback)

---

**💡 TL;DR :** Remplacez `category: "Mangas"` par `categoryId: 5` dans vos requêtes vers `/api/designs` !