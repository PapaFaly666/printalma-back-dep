# 🎯 GUIDE FRONTEND - Affichage Admin Produits Vendeur

## 📋 **Vue d'ensemble**

Ce guide permet au frontend d'afficher et filtrer les produits vendeur côté admin avec tous les statuts : **PENDING**, **APPROVED**, **REJECTED**.

## 🔗 **Endpoint principal**

```
GET /admin/products/validation
```

## 📝 **Paramètres de requête**

| Paramètre | Type | Valeurs | Description |
|-----------|------|---------|-------------|
| `status` | string | `PENDING`, `APPROVED`, `VALIDATED`, `REJECTED` | Filtre par statut |
| `productType` | string | `WIZARD`, `TRADITIONAL`, `ALL` | Filtre par type |
| `vendor` | string | - | Recherche par nom/email vendeur |
| `page` | number | 1, 2, 3... | Numéro de page (défaut: 1) |
| `limit` | number | 10, 20, 50... | Éléments par page (défaut: 20) |

## 🎯 **Exemples de requêtes**

### **1. Produits WIZARD en attente**
```javascript
GET /admin/products/validation?productType=WIZARD&status=PENDING
```

### **2. Produits WIZARD validés**
```javascript
GET /admin/products/validation?productType=WIZARD&status=APPROVED
```

### **3. Produits WIZARD rejetés**
```javascript
GET /admin/products/validation?productType=WIZARD&status=REJECTED
```

### **4. Tous les produits d'un vendeur**
```javascript
GET /admin/products/validation?vendor=Papa
```

### **5. Pagination**
```javascript
GET /admin/products/validation?page=2&limit=10
```

## 📊 **Structure de réponse**

```javascript
{
  "success": true,
  "message": "Produits récupérés avec succès",
  "data": {
    "products": [
      {
        "id": 175,
        "vendorName": "Mon produit",
        "vendorDescription": "Description du produit",
        "vendorPrice": 12000,
        "vendorStock": 10,
        "status": "PENDING",
        "isValidated": false,

        // 🆕 CHAMPS POUR DÉTECTER LES STATUTS
        "adminValidated": false,      // null pour traditionnels, boolean pour WIZARD
        "isRejected": false,          // true si rejeté
        "rejectionReason": null,      // raison du rejet ou null
        "rejectedAt": null,           // date du rejet ou null
        "finalStatus": "PENDING",     // PENDING | APPROVED | REJECTED

        // TYPE DE PRODUIT
        "isWizardProduct": true,
        "productType": "WIZARD",      // WIZARD | TRADITIONAL
        "hasDesign": false,

        // INFORMATIONS VENDEUR
        "vendor": {
          "id": 7,
          "firstName": "Papa",
          "lastName": "Diagne",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré"
        },

        // PRODUIT DE BASE
        "adminProductName": "Polo",
        "baseProduct": {
          "id": 34,
          "name": "Polo"
        },

        // COULEURS ET TAILLES SÉLECTIONNÉES
        "selectedColors": [
          {
            "id": 35,
            "name": "Rouge",
            "colorCode": "#f00a0a"
          }
        ],
        "selectedSizes": [
          {
            "id": 159,
            "sizeName": "XXL"
          }
        ],

        // IMAGES DU VENDEUR (WIZARD uniquement)
        "vendorImages": [
          {
            "id": 489,
            "imageType": "base",
            "cloudinaryUrl": "https://...",
            "width": 800,
            "height": 800
          }
        ],

        // DATES
        "createdAt": "2025-09-24T23:22:33.918Z",
        "updatedAt": "2025-09-24T23:22:33.918Z",
        "validatedAt": null,
        "validatedBy": null
      }
    ],

    // PAGINATION
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 20,
      "hasNext": false,
      "hasPrevious": false
    },

    // STATISTIQUES
    "stats": {
      "pending": 1,
      "validated": 0,
      "rejected": 0,
      "total": 1,
      "wizardProducts": 1,
      "traditionalProducts": 0
    }
  }
}
```

## 🎨 **Logique d'affichage Frontend**

### **1. Détection du statut**

```javascript
function getProductStatus(product) {
  // Priorité : finalStatus (calculé côté backend)
  return product.finalStatus; // "PENDING" | "APPROVED" | "REJECTED"
}

function getStatusColor(finalStatus) {
  switch(finalStatus) {
    case 'PENDING': return 'orange';
    case 'APPROVED': return 'green';
    case 'REJECTED': return 'red';
    default: return 'gray';
  }
}

function getStatusLabel(finalStatus) {
  switch(finalStatus) {
    case 'PENDING': return 'En attente';
    case 'APPROVED': return 'Validé';
    case 'REJECTED': return 'Rejeté';
    default: return 'Inconnu';
  }
}
```

### **2. Affichage conditionnel des informations**

```javascript
function renderProductCard(product) {
  return `
    <div class="product-card">
      <h3>${product.vendorName}</h3>
      <p>Type: ${product.productType}</p>
      <p>Prix: ${product.vendorPrice / 100}€</p>

      <!-- STATUT -->
      <span class="status status-${getStatusColor(product.finalStatus)}">
        ${getStatusLabel(product.finalStatus)}
      </span>

      <!-- REJET (si applicable) -->
      ${product.isRejected ? `
        <div class="rejection-info">
          <p><strong>Rejeté:</strong> ${product.rejectionReason}</p>
          <p><small>Le: ${new Date(product.rejectedAt).toLocaleDateString()}</small></p>
        </div>
      ` : ''}

      <!-- VALIDATION WIZARD -->
      ${product.isWizardProduct ? `
        <p>Validation admin: ${product.adminValidated ? 'Oui' : 'Non'}</p>
      ` : ''}

      <!-- VENDEUR -->
      <div class="vendor-info">
        <p><strong>${product.vendor.firstName} ${product.vendor.lastName}</strong></p>
        <p>${product.vendor.shop_name}</p>
        <p>${product.vendor.email}</p>
      </div>
    </div>
  `;
}
```

### **3. Système de filtres**

```javascript
// Filtres disponibles
const filters = {
  status: ['ALL', 'PENDING', 'APPROVED', 'REJECTED'],
  productType: ['ALL', 'WIZARD', 'TRADITIONAL'],
  vendor: '', // Recherche libre
};

// Fonction de filtrage
function buildFilterUrl(filters) {
  const params = new URLSearchParams();

  if (filters.status !== 'ALL') {
    params.set('status', filters.status);
  }

  if (filters.productType !== 'ALL') {
    params.set('productType', filters.productType);
  }

  if (filters.vendor.trim()) {
    params.set('vendor', filters.vendor);
  }

  return `/admin/products/validation?${params.toString()}`;
}
```

## 🔧 **Actions administrateur**

### **1. Valider un produit**

```javascript
// REQUEST
POST /admin/products/{productId}/validate
Content-Type: application/json

{
  "approved": true
}

// RESPONSE
{
  "success": true,
  "message": "Produit WIZARD validé avec succès",
  "productId": 176,
  "newStatus": "PUBLISHED",
  "validatedAt": "2025-09-24T..."
}
```

### **2. Rejeter un produit**

```javascript
// REQUEST
POST /admin/products/{productId}/validate
Content-Type: application/json

{
  "approved": false,
  "rejectionReason": "Images de mauvaise qualité"
}

// RESPONSE
{
  "success": true,
  "message": "Produit WIZARD rejeté avec succès",
  "productId": 176,
  "newStatus": "PENDING",
  "validatedAt": "2025-09-24T..."
}
```

## 📱 **Exemple d'interface**

### **Filtres**
```
┌─────────────────────────────────────────┐
│ [Statut ▼] [Type ▼] [Vendeur_____] [🔍] │
│ PENDING    WIZARD   Papa                │
└─────────────────────────────────────────┘
```

### **Liste des produits**
```
┌───────────────────────────────────────┐
│ 🎨 WIZARD - Polo                     │
│ Par: Papa Diagne (C'est carré)        │
│ Prix: 120€ | Stock: 10               │
│ 🟠 EN ATTENTE                        │
│ [✅ Valider] [❌ Rejeter]            │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│ 🎨 WIZARD - T-shirt                  │
│ Par: John Doe (Ma Boutique)          │
│ Prix: 25€ | Stock: 5                 │
│ 🔴 REJETÉ                            │
│ Raison: Images floues                │
│ [🔄 Réviser]                         │
└───────────────────────────────────────┘
```

## 🎯 **Points clés pour l'implémentation**

1. **Utiliser `finalStatus`** pour l'affichage du statut
2. **Vérifier `isRejected`** pour afficher les infos de rejet
3. **`adminValidated`** est `null` pour les produits traditionnels
4. **`vendorImages`** n'existe que pour les produits WIZARD
5. **Gérer la pagination** avec les données `pagination`
6. **Afficher les stats** globales depuis `stats`

Ce guide devrait permettre une implémentation complète de l'interface admin ! 🚀