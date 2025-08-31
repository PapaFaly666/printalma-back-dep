# 🎯 Endpoints Admin - Création de Produits Vendeur

## Vue d'ensemble

Ces endpoints permettent aux administrateurs de créer des produits au nom des vendeurs. L'admin peut soit sélectionner un design existant du vendeur, soit créer un nouveau design pour lui.

## Nouveautés 🆕

- **Gestion flexible des designs** : Sélection d'un design existant OU création d'un nouveau
- **Endpoint pour lister les designs** : Voir tous les designs d'un vendeur
- **Validation intelligente** : Détection automatique des cas d'usage

## Endpoints

### 1. 🎯 POST /vendor-product-validation/create-for-vendor

**Créer un produit pour un vendeur**

**Authentification requise** : Admin ou SuperAdmin

#### Deux modes possibles

**Mode 1 : Avec design existant**
```json
{
  "vendorId": 123,
  "designId": 42,
  "baseProductId": 4,
  // ... reste des données
}
```

**Mode 2 : Avec nouveau design**
```json
{
  "vendorId": 123,
  "newDesign": {
    "name": "Design créé par Admin",
    "description": "Design créé pour aider le vendeur",
    "category": "LOGO",
    "imageBase64": "data:image/png;base64,iVBORw0K...",
    "tags": ["admin", "créé"]
  },
  "baseProductId": 4,
  // ... reste des données
}
```

#### Paramètres du body complets

```json
{
  "vendorId": 123,
  "baseProductId": 4,
  
  // OPTION 1: Design existant
  "designId": 42,
  
  // OPTION 2: Nouveau design (mutuellement exclusif avec designId)
  "newDesign": {
    "name": "Design créé par Admin",
    "description": "Design créé par l'administrateur",
    "category": "LOGO",
    "imageBase64": "data:image/png;base64,iVBORw0K...",
    "tags": ["admin", "créé"]
  },
  
  "productStructure": {
    "adminProduct": {
      "id": 4,
      "name": "T-shirt Premium",
      "description": "T-shirt en coton bio",
      "price": 2000,
      "images": {
        "colorVariations": [
          {
            "id": 1,
            "name": "Noir",
            "colorCode": "#000000",
            "images": [
              {
                "id": 1,
                "url": "https://res.cloudinary.com/...",
                "viewType": "FRONT",
                "delimitations": [
                  {
                    "x": 25,
                    "y": 30,
                    "width": 50,
                    "height": 40,
                    "coordinateType": "PERCENTAGE"
                  }
                ]
              }
            ]
          }
        ]
      },
      "sizes": [
        { "id": 1, "sizeName": "S" },
        { "id": 2, "sizeName": "M" },
        { "id": 3, "sizeName": "L" }
      ]
    },
    "designApplication": {
      "positioning": "CENTER",
      "scale": 0.75
    }
  },
  "vendorPrice": 2500,
  "vendorName": "T-shirt Design Dragon",
  "vendorDescription": "T-shirt premium avec design dragon exclusif",
  "vendorStock": 100,
  "selectedColors": [
    { "id": 1, "name": "Noir", "colorCode": "#000000" },
    { "id": 2, "name": "Blanc", "colorCode": "#FFFFFF" }
  ],
  "selectedSizes": [
    { "id": 1, "sizeName": "S" },
    { "id": 2, "sizeName": "M" },
    { "id": 3, "sizeName": "L" }
  ],
  "forcedStatus": "DRAFT",
  "postValidationAction": "AUTO_PUBLISH",
  "designPosition": {
    "x": 0,
    "y": 0,
    "scale": 0.75,
    "rotation": 0
  },
  "bypassAdminValidation": false
}
```

#### Réponse

```json
{
  "success": true,
  "message": "Produit créé avec succès pour John Doe",
  "productId": 456,
  "vendorId": 123,
  "vendorName": "John Doe",
  "status": "DRAFT",
  "createdBy": "admin_created",
  "newDesignCreated": true,
  "newDesignName": "Design créé par Admin",
  "designId": 78,
  "designUrl": "https://res.cloudinary.com/..."
}
```

### 2. 👥 GET /vendor-product-validation/vendors

**Lister les vendeurs disponibles**

**Authentification requise** : Admin ou SuperAdmin

#### Réponse

```json
{
  "vendors": [
    {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "shop_name": "Boutique John",
      "vendeur_type": "DESIGNER",
      "status": true,
      "totalProducts": 15,
      "publishedProducts": 8,
      "totalDesigns": 12,
      "lastLogin": "2023-12-07T09:00:00Z",
      "memberSince": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 25,
  "stats": {
    "active": 20,
    "inactive": 5,
    "withProducts": 15,
    "withoutProducts": 10
  }
}
```

### 3. 🎨 GET /vendor-product-validation/vendors/:vendorId/designs

**Lister les designs d'un vendeur**

**Authentification requise** : Admin ou SuperAdmin

#### Paramètres d'URL
- `vendorId` : ID du vendeur

#### Paramètres de requête (optionnels)
- `limit` : Nombre de designs à retourner (défaut: 20)
- `offset` : Décalage pour la pagination (défaut: 0)
- `status` : Filtrer par statut (`validated`, `pending`, `rejected`)

#### Réponse

```json
{
  "designs": [
    {
      "id": 42,
      "name": "Mon Design Génial",
      "description": "Description de mon design",
      "category": "LOGO",
      "imageUrl": "https://res.cloudinary.com/...",
      "cloudinaryPublicId": "design_123",
      "isValidated": true,
      "createdAt": "2023-12-01T10:00:00Z",
      "validatedAt": "2023-12-07T14:00:00Z",
      "rejectionReason": null,
      "tags": ["créatif", "moderne"]
    }
  ],
  "total": 12,
  "stats": {
    "validated": 8,
    "pending": 3,
    "rejected": 1
  }
}
```

## Workflow Recommandé

### 1. 📋 Préparation
```javascript
// 1. Récupérer les vendeurs disponibles
const vendorsResponse = await fetch('/vendor-product-validation/vendors', {
  headers: { Authorization: `Bearer ${adminToken}` }
});
const { vendors } = await vendorsResponse.json();

// 2. Sélectionner un vendeur
const selectedVendor = vendors.find(v => v.id === 123);
console.log(`Vendeur: ${selectedVendor.firstName} ${selectedVendor.lastName}`);
console.log(`Designs disponibles: ${selectedVendor.totalDesigns}`);
```

### 2. 🎨 Gestion des Designs

**Option A : Utiliser un design existant**
```javascript
// 1. Récupérer les designs du vendeur
const designsResponse = await fetch(`/vendor-product-validation/vendors/${vendorId}/designs`, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
const { designs } = await designsResponse.json();

// 2. Sélectionner un design
const selectedDesign = designs.find(d => d.isValidated);

// 3. Créer le produit avec design existant
const productData = {
  vendorId: vendorId,
  designId: selectedDesign.id,
  baseProductId: 4,
  // ... autres données
};
```

**Option B : Créer un nouveau design**
```javascript
// Créer le produit avec nouveau design
const productData = {
  vendorId: vendorId,
  newDesign: {
    name: "Design pour Client X",
    description: "Design créé spécialement pour ce client",
    category: "LOGO",
    imageBase64: base64ImageData,
    tags: ["client", "spécial"]
  },
  baseProductId: 4,
  // ... autres données
};
```

### 3. 🚀 Création du Produit
```javascript
const createResponse = await fetch('/vendor-product-validation/create-for-vendor', {
  method: 'POST',
  headers: { 
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(productData)
});

const result = await createResponse.json();
console.log(`Produit créé: ${result.productId}`);
console.log(`Design ${result.newDesignCreated ? 'créé' : 'existant'}: ${result.designId}`);
```

## Validations

### Création de produit

1. **Vendeur** : Doit exister, être actif et avoir le rôle VENDEUR
2. **Design** : 
   - **Mode existant** : Doit exister et appartenir au vendeur
   - **Mode nouveau** : Image base64 valide, catégorie autorisée
3. **Exclusivité** : `designId` et `newDesign` sont mutuellement exclusifs
4. **Produit de base** : Doit exister dans la base de données
5. **Structure admin** : Doit être valide et complète

### Logique de statut

- **Normal** : Suit la logique vendeur (PENDING si design non validé, DRAFT/PUBLISHED si validé)
- **Bypass admin** : Force le statut à PUBLISHED si bypassAdminValidation = true
- **Forcé** : Utilise forcedStatus si fourni
- **Nouveau design** : Toujours PENDING par défaut (nécessite validation)

## Exemples d'utilisation

### 1. Créer un produit avec design existant

```bash
curl -X POST "http://localhost:3000/vendor-product-validation/create-for-vendor" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": 123,
    "designId": 42,
    "baseProductId": 4,
    "vendorName": "T-shirt avec Design Existant",
    "vendorDescription": "T-shirt utilisant un design validé",
    "vendorPrice": 2500,
    "vendorStock": 50,
    "selectedColors": [{"id": 1, "name": "Noir", "colorCode": "#000000"}],
    "selectedSizes": [{"id": 1, "sizeName": "M"}],
    "productStructure": {...}
  }'
```

### 2. Créer un produit avec nouveau design

```bash
curl -X POST "http://localhost:3000/vendor-product-validation/create-for-vendor" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": 123,
    "newDesign": {
      "name": "Logo Client Spécial",
      "description": "Design créé pour ce client",
      "category": "LOGO",
      "imageBase64": "data:image/png;base64,iVBORw0K...",
      "tags": ["client", "spécial"]
    },
    "baseProductId": 4,
    "vendorName": "T-shirt Logo Client",
    "vendorDescription": "T-shirt avec nouveau design",
    "vendorPrice": 2800,
    "vendorStock": 25,
    "selectedColors": [{"id": 1, "name": "Noir", "colorCode": "#000000"}],
    "selectedSizes": [{"id": 1, "sizeName": "M"}],
    "productStructure": {...}
  }'
```

### 3. Récupérer les designs d'un vendeur

```bash
curl -X GET "http://localhost:3000/vendor-product-validation/vendors/123/designs?status=validated" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Cas d'usage

### 1. Support Client - Design Existant

```javascript
// Client veut un produit avec un design déjà créé
const supportProduct = {
  vendorId: vendorId,
  designId: existingDesignId, // Design déjà validé
  baseProductId: baseProductId,
  vendorName: "Produit pour Support Client",
  vendorDescription: "Créé rapidement pour aider le client",
  vendorPrice: 2500,
  vendorStock: 10,
  selectedColors: colors,
  selectedSizes: sizes,
  productStructure: productStructure,
  forcedStatus: "PUBLISHED", // Publication immédiate
  bypassAdminValidation: true
};
```

### 2. Support Client - Nouveau Design

```javascript
// Client a besoin d'un design personnalisé
const customProduct = {
  vendorId: vendorId,
  newDesign: {
    name: "Design Support Client",
    description: "Design créé spécialement pour résoudre le problème du client",
    category: "LOGO",
    imageBase64: clientDesignBase64,
    tags: ["support", "urgent", "client"]
  },
  baseProductId: baseProductId,
  vendorName: "Produit Personnalisé Client",
  vendorDescription: "Produit avec design personnalisé",
  vendorPrice: 3000,
  vendorStock: 5,
  selectedColors: colors,
  selectedSizes: sizes,
  productStructure: productStructure,
  postValidationAction: "TO_DRAFT" // Pour révision vendeur
};
```

### 3. Tests Automatisés

```javascript
// Tester avec design existant
const testExisting = {
  vendorId: testVendorId,
  designId: testDesignId,
  vendorName: "Test Product Existing",
  // ... données de test
  bypassAdminValidation: true,
  forcedStatus: "PUBLISHED"
};

// Tester avec nouveau design
const testNew = {
  vendorId: testVendorId,
  newDesign: {
    name: "Test Design Auto",
    category: "LOGO",
    imageBase64: testImageBase64
  },
  vendorName: "Test Product New Design",
  // ... données de test
  bypassAdminValidation: true
};
```

## Différences avec l'endpoint vendeur

| Aspect | Endpoint Vendeur | Endpoint Admin |
|--------|------------------|----------------|
| **Permissions** | Vendeur uniquement | Admin/SuperAdmin |
| **Vendeur** | Automatique (token) | Sélectionné (vendorId) |
| **Design** | Doit être créé avant | Existant OU nouveau |
| **Création Design** | Non | Oui, au nom du vendeur |
| **Validation** | Stricte | Peut être bypassée |
| **Statut** | Logique normale | Peut être forcé |
| **Usage** | Interface vendeur | Interface admin + support |

## Codes d'erreur

- `403 Forbidden` : Seuls les admins peuvent accéder
- `404 Not Found` : Vendeur, design ou produit de base non trouvé
- `400 Bad Request` : 
  - Données invalides
  - `designId` et `newDesign` fournis ensemble
  - Aucun design fourni
  - Image base64 invalide
- `500 Internal Server Error` : Erreur serveur

## Notes importantes

1. **Sécurité** : Vérification stricte des permissions admin
2. **Flexibilité** : Gestion des designs existants et nouveaux
3. **Validation** : Designs créés par admin nécessitent validation par défaut
4. **Traçabilité** : Marquage "admin_created" pour l'audit
5. **Cloudinary** : Upload automatique des nouveaux designs
6. **Compatibilité** : Structure identique à l'endpoint vendeur

Cette fonctionnalité améliorée est particulièrement utile pour :
- 🛠️ **Support client avancé** : Création rapide avec ou sans design
- 🎨 **Gestion des designs** : Réutilisation ou création selon le besoin  
- 🧪 **Tests automatisés** : Couverture des deux scénarios
- 📊 **Démonstrations** : Flexibilité totale pour les présentations
- 🚀 **Déploiement initial** : Création massive de contenu
- 🔧 **Maintenance** : Corrections et ajustements avec nouveaux designs 