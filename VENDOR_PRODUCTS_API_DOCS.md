# 📋 Documentation API - Endpoint Produits Vendeurs

## 🌐 Endpoint Principal

### `GET http://localhost:3004/public/vendor-products`

**Description** : Récupère la liste complète des produits vendeurs avec filtres avancés et pagination.

---

## 🔍 Paramètres de Requête (Query Parameters)

### Paramètres Disponibles

| Paramètre | Type | Description | Exemple | Valeur par défaut |
|-----------|------|-------------|---------|-------------------|
| `limit` | number | Nombre maximum de produits retournés (max 100) | `20` | `20` |
| `offset` | number | Nombre de produits à sauter (pagination) | `0` | `0` |
| `search` | string | **Recherche textuelle globale** dans plusieurs champs | `"chemise"` | - |
| `adminProductName` | string | **Filtre par nom du produit admin (mockup)** | `"Tshirt"` | - |
| `vendorId` | number | Filtrer par ID du vendeur | `123` | - |
| `category` | string | Filtrer par nom de catégorie | `"Vêtements"` | - |
| `minPrice` | number | Prix minimum du produit | `10.00` | - |
| `maxPrice` | number | Prix maximum du produit | `100.00` | - |
| `allProducts` | boolean | `false` = uniquement les best-sellers, `true` = tous les produits | `true` | `true` |

---

## 🎯 Filtres Détaillés

### 1. 🔎 Filtre `search` (Recherche Textuelle)

**Description** : Recherche dans plusieurs champs du produit (nom, description, catégories, etc.)

**Caractéristiques** :
- ✅ Recherche insensible à la casse
- ✅ Recherche partielle (contient)
- ✅ Multiple champs analysés

**Exemples d'utilisation** :
```bash
# Rechercher des tshirts
curl "http://localhost:3004/public/vendor-products?search=tshirt"

# Rechercher des produits bleus
curl "http://localhost:3004/public/vendor-products?search=bleu"

# Rechercher par vendeur
curl "http://localhost:3004/public/vendor-products?search=PAPA"
```

### 2. 🏷️ Filtre `adminProductName` (NOUVEAU)

**Description** : Filtre spécifique par le nom du produit admin (produit de base/mockup)

**Caractéristiques** :
- ✅ Recherche insensible à la casse
- ✅ Recherche partielle (contient)
- ✅ Filtre sur le champ `adminProduct.name`
- ✅ Plus précis que le `search` global

**Exemples d'utilisation** :
```bash
# Rechercher tous les Tshirts
curl "http://localhost:3004/public/vendor-products?adminProductName=Tshirt"

# Rechercher tous les Polos
curl "http://localhost:3004/public/vendor-products?adminProductName=Polos"

# Rechercher toutes les Chemises
curl "http://localhost:3004/public/vendor-products?adminProductName=Chemise"
```

### 3. 🛍️ Filtre `category` (Catégorie)

**Description** : Filtrer par nom de catégorie principale

**Exemples d'utilisation** :
```bash
# Produits de la catégorie Vêtements
curl "http://localhost:3004/public/vendor-products?category=Vêtements"

# Produits de la catégorie Accessoires
curl "http://localhost:3004/public/vendor-products?category=Accessoires"
```

### 4. 💰 Filtres de Prix

**Description** : Filtrer par fourchette de prix

**Exemples d'utilisation** :
```bash
# Produits entre 20€ et 80€
curl "http://localhost:3004/public/vendor-products?minPrice=20&maxPrice=80"

# Produits à partir de 50€
curl "http://localhost:3004/public/vendor-products?minPrice=50"

# Produits jusqu'à 100€
curl "http://localhost:3004/public/vendor-products?maxPrice=100"
```

### 5. 🏪 Filtre `vendorId` (Vendeur Spécifique)

**Description** : Filtrer les produits d'un vendeur spécifique

**Exemples d'utilisation** :
```bash
# Produits du vendeur ID 37
curl "http://localhost:3004/public/vendor-products?vendorId=37"
```

---

## 🔄 Combinaisons de Filtres

### Exemples de Filtrage Avancé

**1. Combinaison `adminProductName` + Prix** :
```bash
# Tshirts entre 20€ et 60€
curl "http://localhost:3004/public/vendor-products?adminProductName=Tshirt&minPrice=20&maxPrice=60"
```

**2. Combinaison `search` + Catégorie** :
```bash
# Recherche "bleu" dans la catégorie Vêtements
curl "http://localhost:3004/public/vendor-products?search=bleu&category=Vêtements"
```

**3. Filtres multiples complets** :
```bash
# Tshirts du vendeur 37 entre 20€ et 80€
curl "http://localhost:3004/public/vendor-products?adminProductName=Tshirt&vendorId=37&minPrice=20&maxPrice=80"
```

**4. Recherche combinée** :
```bash
# Recherche textuelle + nom de produit admin
curl "http://localhost:3004/public/vendor-products?search=PIRATE&adminProductName=Tshirt"
```

---

## 📊 Pagination

### Paramètres de Pagination

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `limit` | Nombre de résultats par page (max 100) | `limit=20` |
| `offset` | Nombre de résultats à sauter | `offset=40` (page 3) |

**Calcul de l'offset** : `offset = (page - 1) × limit`

**Exemples** :
```bash
# Page 1 (20 premiers résultats)
curl "http://localhost:3004/public/vendor-products?limit=20&offset=0"

# Page 2 (résultats 21 à 40)
curl "http://localhost:3004/public/vendor-products?limit=20&offset=20"

# Page 3 (résultats 41 à 60)
curl "http://localhost:3004/public/vendor-products?limit=20&offset=40"
```

---

## 📋 Structure de la Réponse

### Format de Réponse Standard

```json
{
  "success": true,
  "message": "Produits récupérés avec succès",
  "data": [
    {
      "id": 36,
      "vendorName": "Tshirt",
      "price": 6000,
      "status": "PUBLISHED",
      "bestSeller": {
        "isBestSeller": false,
        "salesCount": 0,
        "totalRevenue": 0
      },
      "adminProduct": {
        "id": 66,
        "name": "Tshirt",
        "description": "Tshirt pour été",
        "price": 6000,
        "colorVariations": [
          {
            "id": 87,
            "name": "Blanc",
            "colorCode": "#ffffff",
            "productId": 66,
            "images": [
              {
                "id": 80,
                "view": "Front",
                "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1761127022/printalma/1761127021614-T-shirt_Blanc.jpg",
                "naturalWidth": 1200,
                "naturalHeight": 1199
              }
            ],
            "delimitations": [...]
          }
        ],
        "sizes": []
      },
      "designApplication": {
        "hasDesign": true,
        "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1760955842/vendor-designs/vendor_37_design_1760955841034.png",
        "positioning": "CENTER",
        "scale": 0.6,
        "mode": "PRESERVED"
      },
      "designDelimitations": [...],
      "design": {
        "id": 1,
        "name": "PIRATE",
        "description": "",
        "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1760955842/vendor-designs/vendor_37_design_1760955841034.png",
        "tags": [],
        "isValidated": true
      },
      "designPositions": [...],
      "vendor": {
        "id": 37,
        "fullName": "Papa DIAGNE",
        "shop_name": "C'est carré",
        "profile_photo_url": null
      },
      "images": {
        "adminReferences": [...],
        "total": 4,
        "primaryImageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1761127022/printalma/1761127021614-T-shirt_Blanc.jpg"
      },
      "selectedSizes": [...],
      "selectedColors": [...],
      "designId": 1
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Structure de la Pagination

```json
{
  "pagination": {
    "total": 150,        // Nombre total de produits
    "limit": 20,         // Limite par page
    "offset": 0,         // Décalage actuel
    "hasMore": false     // Y a-t-il plus de résultats ?
  }
}
```

### Réponse Vide (Aucun résultat)

```json
{
  "success": true,
  "message": "Produits récupérés avec succès",
  "data": [],
  "pagination": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## 🚀 Exemples d'Utilisation

### Cas d'Usage Courants

**1. Afficher tous les produits** :
```bash
curl "http://localhost:3004/public/vendor-products"
```

**2. Rechercher des Tshirts** :
```bash
curl "http://localhost:3004/public/vendor-products?adminProductName=Tshirt"
```

**3. Rechercher tous les Polos** :
```bash
curl "http://localhost:3004/public/vendor-products?adminProductName=Polos"
```

**4. Recherche textuelle générale** :
```bash
curl "http://localhost:3004/public/vendor-products?search=bleu"
```

**5. Filtrer par prix** :
```bash
curl "http://localhost:3004/public/vendor-products?minPrice=20&maxPrice=100"
```

**6. Combinaison complète** :
```bash
curl "http://localhost:3004/public/vendor-products?adminProductName=Tshirt&minPrice=20&maxPrice=80&limit=10"
```

### Exemples pour le Frontend

**JavaScript/React** :
```javascript
// Appel basique
const response = await fetch('http://localhost:3004/public/vendor-products');
const data = await response.json();

// Avec filtres
const params = new URLSearchParams({
  adminProductName: 'Tshirt',
  minPrice: 20,
  maxPrice: 80,
  limit: 10
});

const response = await fetch(`http://localhost:3004/public/vendor-products?${params}`);
const data = await response.json();
```

**Vue.js** :
```javascript
// Dans une méthode Vue
async function loadProducts(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:3004/public/vendor-products?${params}`);
  return await response.json();
}

// Utilisation
const products = await loadProducts({
  adminProductName: 'Tshirt',
  search: 'bleu'
});
```

---

## ✅ Bonnes Pratiques

### 1. Performance
- Utilisez la pagination pour éviter de charger trop de données
- Limitez les requêtes à 100 résultats maximum
- Utilisez les filtres spécifiques (`adminProductName`) plutôt que la recherche globale quand possible

### 2. Gestion des Erreurs
```javascript
try {
  const response = await fetch(url);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message);
  }

  return data;
} catch (error) {
  console.error('Erreur API:', error);
  return { success: false, data: [] };
}
```

### 3. Debouncing pour la recherche
```javascript
// Éviter les appels multiples lors de la saisie
let timeoutId;
const searchInput = document.getElementById('search');

searchInput.addEventListener('input', (e) => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    fetchProducts({ search: e.target.value });
  }, 300);
});
```

---

## 🧪 Tests d'API

### Scripts de Test

```bash
#!/bin/bash
# test-vendor-products.sh

echo "🧪 Tests de l'API Vendor Products"
echo "================================"

# Test 1: Tous les produits
echo "1. Test: Tous les produits"
curl -s "http://localhost:3004/public/vendor-products" | jq '.success, .data | length'

# Test 2: Recherche tshirt
echo "2. Test: Recherche tshirt"
curl -s "http://localhost:3004/public/vendor-products?search=tshirt" | jq '.success, .data | length'

# Test 3: Filtre adminProductName
echo "3. Test: adminProductName=Tshirt"
curl -s "http://localhost:3004/public/vendor-products?adminProductName=Tshirt" | jq '.success, .data | length'

# Test 4: Filtre prix
echo "4. Test: Prix entre 20 et 80"
curl -s "http://localhost:3004/public/vendor-products?minPrice=20&maxPrice=80" | jq '.success, .data | length'

# Test 5: Combinaison
echo "5. Test: Combinaison complète"
curl -s "http://localhost:3004/public/vendor-products?adminProductName=Tshirt&minPrice=20&maxPrice=100&limit=5" | jq '.success, .data | length'

echo "✅ Tests terminés"
```

---

## 📞 Support

Pour toute question sur l'utilisation de cette API :

- **Documentation** : Ce fichier guide
- **Tests** : Utilisez les exemples ci-dessus
- **Support technique** : Contactez l'équipe backend

---

**Dernière mise à jour** : 22 octobre 2025
**Version API** : v1.0
**Statut** : ✅ Production Ready