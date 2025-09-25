# 📋 Guide Complet - API Admin Validation des Produits

> **Version**: 2.0 - Septembre 2025
> **Statut**: ✅ PRODUCTION READY
> **Correction**: Champ `adminValidated` maintenant fonctionnel

## 🎯 Vue d'ensemble

Cette API permet aux administrateurs de gérer la validation des produits vendeurs, avec une **distinction automatique** entre :
- **Produits WIZARD** : Créés via l'assistant (sans design personnel)
- **Produits TRADITIONNELS** : Avec design personnalisé uploadé

---

## 📡 Endpoints Disponibles

### 1. **GET /api/admin/products/validation**
*Récupérer tous les produits en attente avec filtres*

### 2. **POST /api/admin/products/{productId}/validate**
*Valider/Rejeter un produit individuel*

### 3. **PATCH /api/admin/validate-products-batch**
*Valider/Rejeter plusieurs produits en lot*

---

## 🔍 1. Récupération des Produits (GET)

### **Endpoint**
```
GET /api/admin/products/validation
```

### **Headers Requis**
```http
Authorization: Bearer {JWT_TOKEN}
Accept: application/json
```

### **Paramètres de Requête (Query Parameters)**

| Paramètre | Type | Requis | Valeurs possibles | Description |
|-----------|------|---------|-------------------|-------------|
| `page` | number | Non | 1, 2, 3... | Page à récupérer (défaut: 1) |
| `limit` | number | Non | 10, 20, 50... | Nombre d'éléments par page (défaut: 20) |
| `productType` | string | Non | `WIZARD`, `TRADITIONAL`, `ALL` | Filtrer par type de produit |
| `vendor` | string | Non | "nom vendeur" | Recherche par nom/email/boutique vendeur |
| `status` | string | Non | `PENDING`, `APPROVED`, `REJECTED`, `ALL` | Filtrer par statut de validation |

### **Exemples de Requêtes**

#### Récupérer tous les produits
```bash
curl -X GET "http://localhost:3004/api/admin/products/validation" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json"
```

#### Filtrer les produits WIZARD en attente
```bash
curl -X GET "http://localhost:3004/api/admin/products/validation?productType=WIZARD&status=PENDING&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json"
```

#### Rechercher par vendeur
```bash
curl -X GET "http://localhost:3004/api/admin/products/validation?vendor=Papa&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json"
```

---

### **Réponse (Response)**

```json
{
  "success": true,
  "message": "Produits en attente récupérés avec succès",
  "data": {
    "products": [
      {
        "id": 177,
        "vendorName": "yoyo",
        "vendorDescription": "vvvvvvvvvv",
        "vendorPrice": 12000,
        "vendorStock": 10,
        "baseProductId": 33,

        // 🎨 COULEURS ET TAILLES SÉLECTIONNÉES
        "colors": [
          {
            "id": 33,
            "name": "Rouge",
            "colorCode": "#ec0909"
          }
        ],
        "sizes": [
          {
            "id": 156,
            "sizeName": "400ml"
          },
          {
            "id": 157,
            "sizeName": "500ml"
          }
        ],

        // 🏷️ INFORMATIONS DE VALIDATION
        "status": "PUBLISHED",
        "isValidated": true,
        "validatedAt": "2025-09-25T01:03:11.905Z",
        "validatedBy": 3,
        "postValidationAction": "AUTO_PUBLISH",

        // 🆕 CHAMPS CRITIQUES POUR ADMIN (CORRIGÉS)
        "adminValidated": true,        // ✅ CORRIGÉ - Vraie valeur de la BD
        "isRejected": false,
        "rejectedAt": null,
        "finalStatus": "APPROVED",     // PENDING | APPROVED | REJECTED

        // 🎯 DISTINCTION AUTOMATIQUE DES TYPES
        "isWizardProduct": true,
        "productType": "WIZARD",       // WIZARD | TRADITIONAL
        "hasDesign": false,
        "adminProductName": "Mugs",

        // 📋 DÉTAILS DU PRODUIT ADMIN
        "baseProduct": {
          "id": 33,
          "name": "Mugs",
          "mockupImages": [
            {
              "id": 39,
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1757520701/printalma/1757520700536-Mug_noir.jpg",
              "viewType": "Front",
              "colorName": "Noir",
              "colorCode": "#000000"
            }
          ]
        },

        // 🖼️ IMAGES VENDEUR (pour produits WIZARD)
        "vendorImages": [
          {
            "id": 495,
            "imageType": "base",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758762123/wizard-products/wizard-base-1758762122200.jpg",
            "colorName": null,
            "colorCode": null,
            "width": 800,
            "height": 800
          }
        ],

        // 👤 INFORMATIONS VENDEUR
        "vendor": {
          "id": 7,
          "firstName": "Papa",
          "lastName": "Diagne",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré"
        },

        "designCloudinaryUrl": null,
        "rejectionReason": null,
        "createdAt": "2025-09-25T01:02:10.110Z",
        "updatedAt": "2025-09-25T01:03:11.905Z"
      }
    ],

    // 📊 PAGINATION
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 3,
      "itemsPerPage": 20,
      "hasNext": false,
      "hasPrevious": false
    },

    // 📈 STATISTIQUES
    "stats": {
      "pending": 0,
      "validated": 3,
      "rejected": 0,
      "total": 3,
      "wizardProducts": 3,
      "traditionalProducts": 0
    }
  }
}
```

---

## ✅ 2. Validation Individuelle (POST)

### **Endpoint**
```
POST /api/admin/products/{productId}/validate
```

### **Headers Requis**
```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
Accept: application/json
```

### **Body de la Requête**

#### Approuver un produit
```json
{
  "approved": true
}
```

#### Rejeter un produit
```json
{
  "approved": false,
  "rejectionReason": "Images de mauvaise qualité, veuillez utiliser des photos en haute résolution"
}
```

### **Exemples de Requêtes**

#### Approuver le produit ID 177
```bash
curl -X POST "http://localhost:3004/api/admin/products/177/validate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true
  }'
```

#### Rejeter le produit ID 176
```bash
curl -X POST "http://localhost:3004/api/admin/products/176/validate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": false,
    "rejectionReason": "Le design ne respecte pas nos conditions d'\''utilisation"
  }'
```

### **Réponse (Response)**

#### Succès - Produit approuvé
```json
{
  "success": true,
  "message": "Produit WIZARD validé avec succès",
  "productId": 177,
  "newStatus": "PUBLISHED",
  "validatedAt": "2025-09-25T10:30:00.000Z"
}
```

#### Succès - Produit rejeté
```json
{
  "success": true,
  "message": "Produit WIZARD rejeté avec succès",
  "productId": 176,
  "newStatus": "PENDING",
  "validatedAt": null
}
```

#### Erreur - Produit déjà validé
```json
{
  "success": false,
  "message": "Ce produit a déjà été validé",
  "data": null
}
```

---

## 📦 3. Validation en Lot (PATCH)

### **Endpoint**
```
PATCH /api/admin/validate-products-batch
```

### **Headers Requis**
```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
Accept: application/json
```

### **Body de la Requête**

#### Approuver plusieurs produits
```json
{
  "productIds": [177, 176, 175],
  "approved": true
}
```

#### Rejeter plusieurs produits
```json
{
  "productIds": [180, 181, 182],
  "approved": false,
  "rejectionReason": "Non-conformité aux standards de qualité"
}
```

### **Exemple de Requête**

```bash
curl -X PATCH "http://localhost:3004/api/admin/validate-products-batch" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": [177, 176, 175],
    "approved": true
  }'
```

### **Réponse (Response)**

```json
{
  "success": true,
  "message": "3 produits validés avec succès",
  "data": {
    "totalRequested": 3,
    "successCount": 3,
    "errorCount": 0,
    "wizardProcessed": 3,
    "traditionalProcessed": 0,
    "errors": [],
    "processedProducts": [177, 176, 175]
  }
}
```

---

## 🎨 4. Logique Métier Importante

### **Distinction des Types de Produits**

| Champ | Produit WIZARD | Produit TRADITIONNEL |
|-------|---------------|---------------------|
| `isWizardProduct` | `true` | `false` |
| `productType` | `"WIZARD"` | `"TRADITIONAL"` |
| `hasDesign` | `false` | `true` |
| `designId` | `null` | `number` |
| `adminValidated` | `boolean` | `null` |
| `vendorImages` | `Array` (photos vendeur) | `[]` |

### **Statuts Finals**

| `finalStatus` | Description | Condition |
|---------------|-------------|-----------|
| `PENDING` | En attente de validation | `adminValidated = false` (WIZARD) ou `isValidated = false` (TRADITIONNEL) |
| `APPROVED` | Validé et approuvé | `adminValidated = true` (WIZARD) ou `isValidated = true` (TRADITIONNEL) |
| `REJECTED` | Rejeté | `rejectionReason` existe ou `status = "REJECTED"` |

### **Actions Post-Validation**

Quand un admin **approuve** un produit :
- Si `postValidationAction = "AUTO_PUBLISH"` → Statut devient `PUBLISHED`
- Si `postValidationAction = "TO_DRAFT"` → Statut devient `DRAFT`

---

## 🚨 Gestion d'Erreurs

### **Codes d'Erreur Courants**

| Status | Erreur | Message |
|---------|--------|---------|
| `401` | Non authentifié | `"Unauthorized"` |
| `403` | Accès refusé | `"Seuls les administrateurs peuvent valider les produits"` |
| `404` | Produit non trouvé | `"Produit non trouvé"` |
| `400` | Validation échoue | `"Une raison de rejet est obligatoire"` |
| `400` | Produit déjà validé | `"Ce produit a déjà été validé"` |

### **Format d'Erreur Standard**
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "data": null
}
```

---

## 💡 Conseils d'Intégration Frontend

### **1. Affichage de la Liste**

```typescript
interface ProductValidation {
  id: number;
  vendorName: string;
  productType: 'WIZARD' | 'TRADITIONAL';
  adminValidated: boolean | null;
  finalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isRejected: boolean;
  vendor: {
    shop_name: string;
    firstName: string;
    lastName: string;
  };
}

// Badge de statut
function getStatusBadge(product: ProductValidation) {
  switch(product.finalStatus) {
    case 'PENDING':
      return <Badge color="yellow">En Attente</Badge>;
    case 'APPROVED':
      return <Badge color="green">Approuvé</Badge>;
    case 'REJECTED':
      return <Badge color="red">Rejeté</Badge>;
  }
}

// Badge de type
function getTypeBadge(product: ProductValidation) {
  return product.productType === 'WIZARD'
    ? <Badge color="blue">Assistant</Badge>
    : <Badge color="purple">Design Personnel</Badge>;
}
```

### **2. Filtrage et Recherche**

```typescript
// État des filtres
const [filters, setFilters] = useState({
  productType: 'ALL',
  status: 'ALL',
  vendor: '',
  page: 1,
  limit: 20
});

// Construction de l'URL
const queryParams = new URLSearchParams();
if (filters.productType !== 'ALL') queryParams.append('productType', filters.productType);
if (filters.status !== 'ALL') queryParams.append('status', filters.status);
if (filters.vendor.trim()) queryParams.append('vendor', filters.vendor);
queryParams.append('page', filters.page.toString());
queryParams.append('limit', filters.limit.toString());

const apiUrl = `/api/admin/products/validation?${queryParams.toString()}`;
```

### **3. Actions de Validation**

```typescript
// Validation individuelle
async function validateProduct(productId: number, approved: boolean, rejectionReason?: string) {
  try {
    const response = await fetch(`/api/admin/products/${productId}/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        approved,
        ...(rejectionReason && { rejectionReason })
      })
    });

    const result = await response.json();

    if (result.success) {
      toast.success(result.message);
      // Recharger la liste
      refetchProducts();
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    toast.error('Erreur lors de la validation');
  }
}

// Validation en lot
async function validateBatch(productIds: number[], approved: boolean, rejectionReason?: string) {
  try {
    const response = await fetch('/api/admin/validate-products-batch', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productIds,
        approved,
        ...(rejectionReason && { rejectionReason })
      })
    });

    const result = await response.json();

    if (result.success) {
      toast.success(`${result.data.successCount} produits traités avec succès`);
      if (result.data.errorCount > 0) {
        toast.warning(`${result.data.errorCount} erreurs rencontrées`);
      }
      refetchProducts();
    }
  } catch (error) {
    toast.error('Erreur lors de la validation en lot');
  }
}
```

### **4. Affichage des Images**

```typescript
// Pour les produits WIZARD
function renderWizardImages(product: ProductValidation) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {product.vendorImages?.map((image) => (
        <img
          key={image.id}
          src={image.cloudinaryUrl}
          alt={`${image.imageType} - ${image.colorName || 'Base'}`}
          className="w-full h-32 object-cover rounded"
        />
      ))}
    </div>
  );
}

// Pour les produits TRADITIONNELS
function renderTraditionalDesign(product: ProductValidation) {
  return product.designCloudinaryUrl ? (
    <img
      src={product.designCloudinaryUrl}
      alt="Design personnalisé"
      className="w-full h-48 object-contain rounded"
    />
  ) : (
    <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center">
      <span className="text-gray-500">Aucun design</span>
    </div>
  );
}
```

---

## 🔧 Notes Techniques

### **Performance**
- L'API support la pagination pour gérer de grandes listes
- Les images sont optimisées via Cloudinary
- Les requêtes en lot sont traitées séquentiellement pour éviter les conflits

### **Sécurité**
- Authentification JWT requise
- Vérification des rôles (ADMIN/SUPERADMIN uniquement)
- Validation des données côté serveur

### **Base de Données**
- Le champ `adminValidated` est mappé sur `admin_validated` en BD
- Les couleurs et tailles sont stockées en JSON
- Les relations sont optimisées avec des index

---

## 🆕 Changelog - Version 2.0

### **Corrections Majeures**
- ✅ **Champ `adminValidated`** : Maintenant récupéré correctement depuis la base de données
- ✅ **Statut `finalStatus`** : Calcul corrigé pour refléter le vrai statut de validation
- ✅ **Service `formatProductResponse`** : Ajout du champ `adminValidated` manquant

### **Améliorations**
- 🔄 **Logique de validation** : Distinction claire WIZARD vs TRADITIONNEL
- 📊 **Statistiques enrichies** : Compteurs par type de produit
- 🎨 **Images vendeur** : Support complet pour les produits WIZARD

---

**🎉 Cette API est maintenant 100% fonctionnelle et prête pour la production !**

> Pour toute question technique, contactez l'équipe backend.