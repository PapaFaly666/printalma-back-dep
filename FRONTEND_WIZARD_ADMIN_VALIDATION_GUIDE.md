# 📋 GUIDE FRONTEND - VALIDATION ADMIN OBLIGATOIRE PRODUITS WIZARD

## 🎯 Vue d'ensemble

Désormais, **tous les produits WIZARD** (sans design prédéfini) nécessitent une validation admin obligatoire, même si le vendeur choisit "publier directement". Ce guide explique les changements pour le frontend.

## 🔄 Changements dans les réponses API

### 1. **Nouveau champ dans les produits**

Tous les endpoints retournant des produits incluent maintenant :

```json
{
  "id": 123,
  "vendorName": "Mon T-shirt personnalisé",
  "isWizardProduct": true,
  "productType": "WIZARD", // ou "TRADITIONAL"
  "adminValidated": false, // null | false | true
  // ... autres champs
}
```

### 2. **Valeurs du champ `adminValidated`**

| Valeur | Signification | Type de produit |
|--------|---------------|-----------------|
| `null` | Pas concerné par validation admin | TRADITIONAL |
| `false` | En attente de validation admin | WIZARD |
| `true` | Validé par admin | WIZARD |

## 📊 Interface Admin - Liste des produits en attente

### Endpoint: `GET /api/admin/products/validation`

**Comportement modifié :**
- Maintenant inclut automatiquement les produits WIZARD en attente (`adminValidated: false`)
- Distinction claire WIZARD vs TRADITIONAL dans la réponse

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 138,
        "vendorName": "T-shirt avec mes images",
        "isWizardProduct": true,
        "productType": "WIZARD",
        "adminValidated": false, // ⚠️ En attente validation admin
        "hasDesign": false,
        "vendorImages": [
          {
            "id": 45,
            "imageType": "base",
            "cloudinaryUrl": "https://res.cloudinary.com/...",
            "colorName": "Blanc",
            "colorCode": "#FFFFFF"
          }
        ]
      },
      {
        "id": 139,
        "vendorName": "T-shirt design existant",
        "isWizardProduct": false,
        "productType": "TRADITIONAL",
        "adminValidated": null, // ⚠️ Pas concerné
        "hasDesign": true,
        "designCloudinaryUrl": "https://res.cloudinary.com/..."
      }
    ],
    "stats": {
      "wizardProducts": 12, // ⭐ Nouveaux compteurs
      "traditionalProducts": 8
    }
  }
}
```

## 🎨 Interface Admin - Affichage des produits

### 1. **Indicateurs visuels recommandés**

```html
<!-- Badge pour produit WIZARD en attente -->
<div v-if="product.isWizardProduct && product.adminValidated === false"
     class="badge badge-warning">
  🎨 WIZARD - Validation requise
</div>

<!-- Badge pour produit WIZARD validé -->
<div v-if="product.isWizardProduct && product.adminValidated === true"
     class="badge badge-success">
  🎨 WIZARD - Validé
</div>

<!-- Badge pour produit traditionnel -->
<div v-if="!product.isWizardProduct"
     class="badge badge-info">
  📐 TRADITIONNEL
</div>
```

### 2. **Affichage des images**

```javascript
// Pour les produits WIZARD, utiliser vendorImages
if (product.isWizardProduct && product.vendorImages) {
  product.vendorImages.forEach(image => {
    console.log(`Image ${image.imageType}: ${image.cloudinaryUrl}`);
  });
}

// Pour les produits traditionnels, utiliser designCloudinaryUrl
if (!product.isWizardProduct && product.designCloudinaryUrl) {
  console.log(`Design: ${product.designCloudinaryUrl}`);
}
```

## ✅ Validation Admin - Endpoint inchangé

### `POST /api/admin/products/{productId}/validate`

**Le frontend peut continuer à utiliser cet endpoint normalement.**

```javascript
// Approuver un produit WIZARD
const validateProduct = async (productId, approved, rejectionReason = null) => {
  try {
    const response = await fetch(`/api/admin/products/${productId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        approved: approved,
        rejectionReason: rejectionReason
      })
    });

    const result = await response.json();

    if (result.success) {
      // ⭐ Réponse enrichie avec type de produit
      console.log(`Produit ${result.message}`); // "Produit WIZARD validé avec succès"

      // Recharger la liste des produits en attente
      await refreshPendingProducts();
    }
  } catch (error) {
    console.error('Erreur validation:', error);
  }
};
```

## 📱 Interface Vendeur - Modifications

### 1. **Création de produit WIZARD**

**Aucun changement d'API**, mais le comportement a changé :

```javascript
// Même endpoint qu'avant
const createWizardProduct = async (productData) => {
  const response = await fetch('/api/vendor/wizard-products', {
    method: 'POST',
    body: JSON.stringify({
      ...productData,
      forcedStatus: 'PUBLISHED' // ⚠️ Même si "PUBLISHED" demandé...
    })
  });

  const result = await response.json();

  // ⚠️ CHANGEMENT : Le produit sera créé avec adminValidated: false
  // Il restera en attente jusqu'à validation admin
  console.log('Statut créé:', result.status); // Peut être "PENDING" même si "PUBLISHED" demandé
};
```

### 2. **Affichage du statut pour le vendeur**

```javascript
// Logique recommandée pour l'affichage du statut
const getProductStatus = (product) => {
  if (product.isWizardProduct) {
    if (product.adminValidated === false) {
      return {
        status: 'En attente de validation admin',
        color: 'orange',
        icon: '⏳',
        message: 'Votre produit est en cours de validation par notre équipe.'
      };
    } else if (product.adminValidated === true) {
      return {
        status: product.status, // PUBLISHED, DRAFT, etc.
        color: 'green',
        icon: '✅',
        message: 'Produit validé par admin'
      };
    }
  }

  // Produits traditionnels - logique existante
  return {
    status: product.status,
    color: getStatusColor(product.status),
    icon: getStatusIcon(product.status)
  };
};
```

## 🔍 Filtrage et recherche

### 1. **Filtres recommandés pour l'admin**

```html
<!-- Filtre par type de produit -->
<select v-model="filters.productType">
  <option value="ALL">Tous les produits</option>
  <option value="WIZARD">Produits WIZARD seulement</option>
  <option value="TRADITIONAL">Produits traditionnels seulement</option>
</select>

<!-- Filtre par statut de validation -->
<select v-model="filters.validationStatus">
  <option value="ALL">Tous</option>
  <option value="PENDING_WIZARD">WIZARD en attente</option>
  <option value="VALIDATED_WIZARD">WIZARD validés</option>
  <option value="TRADITIONAL">Traditionnels</option>
</select>
```

### 2. **Logique de filtrage JavaScript**

```javascript
const filterProducts = (products, filters) => {
  return products.filter(product => {
    // Filtre par type
    if (filters.productType === 'WIZARD' && !product.isWizardProduct) return false;
    if (filters.productType === 'TRADITIONAL' && product.isWizardProduct) return false;

    // Filtre par statut de validation
    if (filters.validationStatus === 'PENDING_WIZARD') {
      return product.isWizardProduct && product.adminValidated === false;
    }
    if (filters.validationStatus === 'VALIDATED_WIZARD') {
      return product.isWizardProduct && product.adminValidated === true;
    }
    if (filters.validationStatus === 'TRADITIONAL') {
      return !product.isWizardProduct;
    }

    return true;
  });
};
```

## 📊 Dashboard et statistiques

### 1. **Compteurs recommandés**

```javascript
const calculateStats = (products) => {
  const stats = {
    total: products.length,
    wizard: {
      total: 0,
      pending: 0,
      validated: 0
    },
    traditional: {
      total: 0,
      pending: 0,
      published: 0
    }
  };

  products.forEach(product => {
    if (product.isWizardProduct) {
      stats.wizard.total++;
      if (product.adminValidated === false) {
        stats.wizard.pending++;
      } else if (product.adminValidated === true) {
        stats.wizard.validated++;
      }
    } else {
      stats.traditional.total++;
      if (product.status === 'PENDING') {
        stats.traditional.pending++;
      } else if (product.status === 'PUBLISHED') {
        stats.traditional.published++;
      }
    }
  });

  return stats;
};
```

## ⚠️ Points d'attention

### 1. **Gestion des erreurs**

```javascript
// Toujours vérifier si adminValidated existe
const isWizardPending = (product) => {
  return product.isWizardProduct && product.adminValidated === false;
};

// Éviter les erreurs avec les anciens produits
const getValidationStatus = (product) => {
  if (product.adminValidated === undefined || product.adminValidated === null) {
    return 'not_applicable'; // Produit traditionnel
  }
  return product.adminValidated ? 'validated' : 'pending';
};
```

### 2. **Messages utilisateur clairs**

```javascript
const getValidationMessage = (product) => {
  if (!product.isWizardProduct) {
    return "Ce produit suit la validation traditionnelle";
  }

  if (product.adminValidated === false) {
    return "🔄 En attente de validation admin - Vos images personnalisées sont en cours de vérification";
  }

  if (product.adminValidated === true) {
    return "✅ Validé par admin - Votre produit a été approuvé";
  }

  return "Statut de validation inconnu";
};
```

## 🚀 Migration frontend recommandée

### 1. **Étapes**

1. ✅ Mettre à jour les composants d'affichage des produits
2. ✅ Ajouter les nouveaux indicateurs visuels
3. ✅ Adapter les filtres et la recherche
4. ✅ Mettre à jour les messages utilisateur
5. ✅ Tester avec des produits WIZARD existants

### 2. **Tests recommandés**

- [ ] Créer un produit WIZARD → Vérifier statut "En attente"
- [ ] Valider produit WIZARD côté admin → Vérifier statut "Validé"
- [ ] Filtrer par type de produit → Vérifier résultats
- [ ] Affichage des statistiques → Vérifier compteurs

---

**✨ Le frontend est maintenant prêt pour la validation admin obligatoire des produits WIZARD !**