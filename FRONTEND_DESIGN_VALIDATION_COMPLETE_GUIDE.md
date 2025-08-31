# Guide complet - Validation des designs et cascade vers les produits

## 1. Logique métier complète

### Cycle de vie d'un design
1. **Création** : Le vendeur crée un design (`isDraft=true`, `isPending=false`, `isValidated=false`)
2. **Soumission** : Le vendeur soumet pour validation (`isPending=true`, `isDraft=false`)
3. **Validation admin** : L'admin valide ou rejette
   - **VALIDATE** : `isValidated=true`, `isPending=false` + cascade vers produits
   - **REJECT** : `isValidated=false`, `isPending=false`, `rejectionReason` rempli

### Cascade vers les produits lors de la validation
Quand un admin valide un design, **TOUS** les produits liés sont automatiquement mis à jour selon le choix du vendeur :

| Choix vendeur (`postValidationAction`) | Nouveau statut produit | `isValidated` | Action possible |
|---------------------------------------|------------------------|---------------|-----------------|
| `AUTO_PUBLISH` | `PUBLISHED` | `true` | Déjà publié, aucune action |
| `TO_DRAFT` | `DRAFT` | `true` | Vendeur peut publier quand il veut |

### Publication manuelle d'un produit validé
- **Condition** : `status=DRAFT` ET `isValidated=true`
- **Action** : Passe en `PUBLISHED` (sans changer `isValidated`)
- **Endpoint** : `POST /vendor-product-validation/publish/{productId}`

---

## 2. Endpoints API

### 2.1 Gestion des designs (Admin)

#### Lister les designs en attente
```
GET /api/designs/admin/pending
```
**Query params :**
- `page` (number, défaut: 1)
- `limit` (number, défaut: 10)
- `search` (string, optionnel)

**Réponse :**
```json
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": 18,
        "name": "solo-leveling-logo-01",
        "description": "Description du design",
        "imageUrl": "https://res.cloudinary.com/...",
        "thumbnailUrl": "https://res.cloudinary.com/...",
        "category": "LOGO",
        "price": 0,
        "tags": ["vendor-created"],
        "createdAt": "2025-01-05T10:30:00Z",
        "vendor": {
          "id": 4,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "shop_name": "John's Designs"
        },
        "linkedProducts": [
          {
            "id": 13,
            "name": "T-shirt avec logo",
            "price": 2500,
            "postValidationAction": "AUTO_PUBLISH"
          }
        ],
        "totalLinkedProducts": 1,
        "autoPublishCount": 1,
        "toDraftCount": 0
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "hasMore": false
    }
  }
}
```

#### Lister tous les designs (avec filtres)
```
GET /api/designs/admin/all
```
**Query params :**
- `page`, `limit`, `search` (comme précédent)
- `status` : `pending` | `validated` | `rejected` | `all`
- `sortBy` : `createdAt` | `name` | `price`
- `sortOrder` : `asc` | `desc`

#### Valider/Rejeter un design
```
PUT /api/designs/{id}/validate
```
**Corps :**
```json
{
  "action": "VALIDATE",           // ou "REJECT"
  "rejectionReason": "Motif..."   // requis si action=REJECT
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Design validé avec succès",
  "data": {
    "id": 18,
    "name": "solo-leveling-logo-01",
    "isValidated": true,
    "isPending": false,
    "validatedAt": "2025-01-05T11:00:00Z",
    "validatedBy": 1
  },
  "cascadeResults": {
    "affectedProducts": 1,
    "publishedProducts": 1,
    "draftProducts": 0
  }
}
```

### 2.2 Gestion des produits (Vendeur)

#### Lister les produits du vendeur
```
GET /vendor-product-validation/products
```
**Query params :**
- `page`, `limit`, `search`
- `status` : `PUBLISHED` | `DRAFT` | `PENDING`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 13,
        "name": "T-shirt avec logo",
        "status": "DRAFT",
        "isValidated": true,
        "validatedAt": "2025-01-05T11:00:00Z",
        "postValidationAction": "TO_DRAFT",
        "designId": 18,
        "designName": "solo-leveling-logo-01",
        "designImageUrl": "https://res.cloudinary.com/...",
        "price": 2500,
        "canPublish": true  // status=DRAFT && isValidated=true
      }
    ]
  }
}
```

#### Publier un produit validé en brouillon
```
POST /vendor-product-validation/publish/{productId}
```
**Conditions :**
- `status = DRAFT`
- `isValidated = true`
- Appartient au vendeur connecté

**Réponse :**
```json
{
  "success": true,
  "message": "Produit publié avec succès",
  "newStatus": "PUBLISHED"
}
```

---

## 3. Logique d'affichage frontend

### 3.1 Interface Admin - Validation des designs

```tsx
// AdminDesignValidation.tsx
const AdminDesignValidation = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPendingDesigns = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/designs/admin/pending', {
        params: { page: 1, limit: 10 }
      });
      setDesigns(response.data.data.designs);
    } catch (error) {
      console.error('Erreur chargement designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateDesign = async (designId: number, action: 'VALIDATE' | 'REJECT', rejectionReason?: string) => {
    try {
      const response = await axios.put(`/api/designs/${designId}/validate`, {
        action,
        rejectionReason
      });
      
      // Afficher le résultat de la cascade
      const { cascadeResults } = response.data;
      alert(`Design ${action === 'VALIDATE' ? 'validé' : 'rejeté'} ! 
        Produits affectés: ${cascadeResults.affectedProducts}
        Publiés automatiquement: ${cascadeResults.publishedProducts}
        Mis en brouillon: ${cascadeResults.draftProducts}`);
      
      // Recharger la liste
      loadPendingDesigns();
    } catch (error) {
      console.error('Erreur validation:', error);
    }
  };

  return (
    <div>
      {designs.map(design => (
        <div key={design.id} className="design-card">
          <img src={design.imageUrl} alt={design.name} />
          <h3>{design.name}</h3>
          <p>Vendeur: {design.vendor.firstName} {design.vendor.lastName}</p>
          <p>Produits liés: {design.totalLinkedProducts}</p>
          <p>Auto-publication: {design.autoPublishCount}</p>
          <p>Vers brouillon: {design.toDraftCount}</p>
          
          <div className="actions">
            <button 
              onClick={() => validateDesign(design.id, 'VALIDATE')}
              className="btn-validate"
            >
              ✅ Valider
            </button>
            <button 
              onClick={() => {
                const reason = prompt('Motif de rejet:');
                if (reason) validateDesign(design.id, 'REJECT', reason);
              }}
              className="btn-reject"
            >
              ❌ Rejeter
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 3.2 Interface Vendeur - Gestion des produits

```tsx
// VendorProductsPage.tsx
const VendorProductsPage = () => {
  const [products, setProducts] = useState([]);

  const loadProducts = async () => {
    try {
      const response = await axios.get('/vendor-product-validation/products');
      setProducts(response.data.data.products);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const publishProduct = async (productId: number) => {
    try {
      const response = await axios.post(`/vendor-product-validation/publish/${productId}`);
      alert(response.data.message);
      loadProducts(); // Recharger la liste
    } catch (error) {
      console.error('Erreur publication:', error);
    }
  };

  const getStatusBadge = (product) => {
    if (product.status === 'PUBLISHED') {
      return <span className="badge badge-success">Publié</span>;
    }
    if (product.status === 'DRAFT' && product.isValidated) {
      return <span className="badge badge-warning">Validé - Prêt à publier</span>;
    }
    if (product.status === 'DRAFT' && !product.isValidated) {
      return <span className="badge badge-secondary">Brouillon</span>;
    }
    return <span className="badge badge-info">En attente</span>;
  };

  return (
    <div>
      <h2>Mes Produits</h2>
      {products.map(product => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          <p>Prix: {product.price / 100} €</p>
          <p>Design: {product.designName}</p>
          {getStatusBadge(product)}
          
          {/* Bouton publier : visible seulement si DRAFT + validé */}
          {product.canPublish && (
            <button 
              onClick={() => publishProduct(product.id)}
              className="btn-publish"
            >
              🚀 Publier maintenant
            </button>
          )}
          
          {/* Informations de validation */}
          {product.isValidated && (
            <p className="validation-info">
              ✅ Validé le {new Date(product.validatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 4. Codes d'erreur et gestion

### Erreurs courantes

| Code | Erreur | Cause | Solution |
|------|--------|-------|---------|
| 400 | Bad Request | Paramètres invalides | Vérifier le corps de la requête |
| 403 | Forbidden | Pas admin ou pas propriétaire | Vérifier l'authentification |
| 404 | Not Found | Design/produit inexistant | Vérifier l'ID |
| 409 | Conflict | Design déjà validé | Recharger les données |

### Gestion des erreurs en TypeScript

```ts
interface ApiError {
  message: string;
  code: string;
  details?: any;
}

const handleApiError = (error: any): string => {
  if (error.response?.status === 400) {
    return 'Données invalides. Vérifiez votre saisie.';
  }
  if (error.response?.status === 403) {
    return 'Accès non autorisé.';
  }
  if (error.response?.status === 404) {
    return 'Élément non trouvé.';
  }
  return 'Erreur inconnue. Veuillez réessayer.';
};
```

---

## 5. Checklist d'intégration

### Pour l'admin
- [ ] Page de liste des designs en attente
- [ ] Boutons Valider/Rejeter avec confirmation
- [ ] Affichage du nombre de produits qui seront affectés
- [ ] Notification du résultat de la cascade
- [ ] Rechargement automatique après action

### Pour le vendeur
- [ ] Liste des produits avec statuts clairs
- [ ] Bouton "Publier" visible seulement si `DRAFT + validé`
- [ ] Badges de statut différenciés
- [ ] Notifications de validation reçues
- [ ] Mise à jour temps réel après validation admin

### Tests à effectuer
- [ ] Validation d'un design avec produits `AUTO_PUBLISH`
- [ ] Validation d'un design avec produits `TO_DRAFT`
- [ ] Publication manuelle d'un produit validé en brouillon
- [ ] Rejet d'un design et vérification cascade
- [ ] Gestion des erreurs 404/403/400

---

**Dernière mise à jour : 2025-01-05** 
 
 
 
 
 

## 1. Logique métier complète

### Cycle de vie d'un design
1. **Création** : Le vendeur crée un design (`isDraft=true`, `isPending=false`, `isValidated=false`)
2. **Soumission** : Le vendeur soumet pour validation (`isPending=true`, `isDraft=false`)
3. **Validation admin** : L'admin valide ou rejette
   - **VALIDATE** : `isValidated=true`, `isPending=false` + cascade vers produits
   - **REJECT** : `isValidated=false`, `isPending=false`, `rejectionReason` rempli

### Cascade vers les produits lors de la validation
Quand un admin valide un design, **TOUS** les produits liés sont automatiquement mis à jour selon le choix du vendeur :

| Choix vendeur (`postValidationAction`) | Nouveau statut produit | `isValidated` | Action possible |
|---------------------------------------|------------------------|---------------|-----------------|
| `AUTO_PUBLISH` | `PUBLISHED` | `true` | Déjà publié, aucune action |
| `TO_DRAFT` | `DRAFT` | `true` | Vendeur peut publier quand il veut |

### Publication manuelle d'un produit validé
- **Condition** : `status=DRAFT` ET `isValidated=true`
- **Action** : Passe en `PUBLISHED` (sans changer `isValidated`)
- **Endpoint** : `POST /vendor-product-validation/publish/{productId}`

---

## 2. Endpoints API

### 2.1 Gestion des designs (Admin)

#### Lister les designs en attente
```
GET /api/designs/admin/pending
```
**Query params :**
- `page` (number, défaut: 1)
- `limit` (number, défaut: 10)
- `search` (string, optionnel)

**Réponse :**
```json
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": 18,
        "name": "solo-leveling-logo-01",
        "description": "Description du design",
        "imageUrl": "https://res.cloudinary.com/...",
        "thumbnailUrl": "https://res.cloudinary.com/...",
        "category": "LOGO",
        "price": 0,
        "tags": ["vendor-created"],
        "createdAt": "2025-01-05T10:30:00Z",
        "vendor": {
          "id": 4,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "shop_name": "John's Designs"
        },
        "linkedProducts": [
          {
            "id": 13,
            "name": "T-shirt avec logo",
            "price": 2500,
            "postValidationAction": "AUTO_PUBLISH"
          }
        ],
        "totalLinkedProducts": 1,
        "autoPublishCount": 1,
        "toDraftCount": 0
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "hasMore": false
    }
  }
}
```

#### Lister tous les designs (avec filtres)
```
GET /api/designs/admin/all
```
**Query params :**
- `page`, `limit`, `search` (comme précédent)
- `status` : `pending` | `validated` | `rejected` | `all`
- `sortBy` : `createdAt` | `name` | `price`
- `sortOrder` : `asc` | `desc`

#### Valider/Rejeter un design
```
PUT /api/designs/{id}/validate
```
**Corps :**
```json
{
  "action": "VALIDATE",           // ou "REJECT"
  "rejectionReason": "Motif..."   // requis si action=REJECT
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Design validé avec succès",
  "data": {
    "id": 18,
    "name": "solo-leveling-logo-01",
    "isValidated": true,
    "isPending": false,
    "validatedAt": "2025-01-05T11:00:00Z",
    "validatedBy": 1
  },
  "cascadeResults": {
    "affectedProducts": 1,
    "publishedProducts": 1,
    "draftProducts": 0
  }
}
```

### 2.2 Gestion des produits (Vendeur)

#### Lister les produits du vendeur
```
GET /vendor-product-validation/products
```
**Query params :**
- `page`, `limit`, `search`
- `status` : `PUBLISHED` | `DRAFT` | `PENDING`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 13,
        "name": "T-shirt avec logo",
        "status": "DRAFT",
        "isValidated": true,
        "validatedAt": "2025-01-05T11:00:00Z",
        "postValidationAction": "TO_DRAFT",
        "designId": 18,
        "designName": "solo-leveling-logo-01",
        "designImageUrl": "https://res.cloudinary.com/...",
        "price": 2500,
        "canPublish": true  // status=DRAFT && isValidated=true
      }
    ]
  }
}
```

#### Publier un produit validé en brouillon
```
POST /vendor-product-validation/publish/{productId}
```
**Conditions :**
- `status = DRAFT`
- `isValidated = true`
- Appartient au vendeur connecté

**Réponse :**
```json
{
  "success": true,
  "message": "Produit publié avec succès",
  "newStatus": "PUBLISHED"
}
```

---

## 3. Logique d'affichage frontend

### 3.1 Interface Admin - Validation des designs

```tsx
// AdminDesignValidation.tsx
const AdminDesignValidation = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPendingDesigns = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/designs/admin/pending', {
        params: { page: 1, limit: 10 }
      });
      setDesigns(response.data.data.designs);
    } catch (error) {
      console.error('Erreur chargement designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateDesign = async (designId: number, action: 'VALIDATE' | 'REJECT', rejectionReason?: string) => {
    try {
      const response = await axios.put(`/api/designs/${designId}/validate`, {
        action,
        rejectionReason
      });
      
      // Afficher le résultat de la cascade
      const { cascadeResults } = response.data;
      alert(`Design ${action === 'VALIDATE' ? 'validé' : 'rejeté'} ! 
        Produits affectés: ${cascadeResults.affectedProducts}
        Publiés automatiquement: ${cascadeResults.publishedProducts}
        Mis en brouillon: ${cascadeResults.draftProducts}`);
      
      // Recharger la liste
      loadPendingDesigns();
    } catch (error) {
      console.error('Erreur validation:', error);
    }
  };

  return (
    <div>
      {designs.map(design => (
        <div key={design.id} className="design-card">
          <img src={design.imageUrl} alt={design.name} />
          <h3>{design.name}</h3>
          <p>Vendeur: {design.vendor.firstName} {design.vendor.lastName}</p>
          <p>Produits liés: {design.totalLinkedProducts}</p>
          <p>Auto-publication: {design.autoPublishCount}</p>
          <p>Vers brouillon: {design.toDraftCount}</p>
          
          <div className="actions">
            <button 
              onClick={() => validateDesign(design.id, 'VALIDATE')}
              className="btn-validate"
            >
              ✅ Valider
            </button>
            <button 
              onClick={() => {
                const reason = prompt('Motif de rejet:');
                if (reason) validateDesign(design.id, 'REJECT', reason);
              }}
              className="btn-reject"
            >
              ❌ Rejeter
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 3.2 Interface Vendeur - Gestion des produits

```tsx
// VendorProductsPage.tsx
const VendorProductsPage = () => {
  const [products, setProducts] = useState([]);

  const loadProducts = async () => {
    try {
      const response = await axios.get('/vendor-product-validation/products');
      setProducts(response.data.data.products);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const publishProduct = async (productId: number) => {
    try {
      const response = await axios.post(`/vendor-product-validation/publish/${productId}`);
      alert(response.data.message);
      loadProducts(); // Recharger la liste
    } catch (error) {
      console.error('Erreur publication:', error);
    }
  };

  const getStatusBadge = (product) => {
    if (product.status === 'PUBLISHED') {
      return <span className="badge badge-success">Publié</span>;
    }
    if (product.status === 'DRAFT' && product.isValidated) {
      return <span className="badge badge-warning">Validé - Prêt à publier</span>;
    }
    if (product.status === 'DRAFT' && !product.isValidated) {
      return <span className="badge badge-secondary">Brouillon</span>;
    }
    return <span className="badge badge-info">En attente</span>;
  };

  return (
    <div>
      <h2>Mes Produits</h2>
      {products.map(product => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          <p>Prix: {product.price / 100} €</p>
          <p>Design: {product.designName}</p>
          {getStatusBadge(product)}
          
          {/* Bouton publier : visible seulement si DRAFT + validé */}
          {product.canPublish && (
            <button 
              onClick={() => publishProduct(product.id)}
              className="btn-publish"
            >
              🚀 Publier maintenant
            </button>
          )}
          
          {/* Informations de validation */}
          {product.isValidated && (
            <p className="validation-info">
              ✅ Validé le {new Date(product.validatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 4. Codes d'erreur et gestion

### Erreurs courantes

| Code | Erreur | Cause | Solution |
|------|--------|-------|---------|
| 400 | Bad Request | Paramètres invalides | Vérifier le corps de la requête |
| 403 | Forbidden | Pas admin ou pas propriétaire | Vérifier l'authentification |
| 404 | Not Found | Design/produit inexistant | Vérifier l'ID |
| 409 | Conflict | Design déjà validé | Recharger les données |

### Gestion des erreurs en TypeScript

```ts
interface ApiError {
  message: string;
  code: string;
  details?: any;
}

const handleApiError = (error: any): string => {
  if (error.response?.status === 400) {
    return 'Données invalides. Vérifiez votre saisie.';
  }
  if (error.response?.status === 403) {
    return 'Accès non autorisé.';
  }
  if (error.response?.status === 404) {
    return 'Élément non trouvé.';
  }
  return 'Erreur inconnue. Veuillez réessayer.';
};
```

---

## 5. Checklist d'intégration

### Pour l'admin
- [ ] Page de liste des designs en attente
- [ ] Boutons Valider/Rejeter avec confirmation
- [ ] Affichage du nombre de produits qui seront affectés
- [ ] Notification du résultat de la cascade
- [ ] Rechargement automatique après action

### Pour le vendeur
- [ ] Liste des produits avec statuts clairs
- [ ] Bouton "Publier" visible seulement si `DRAFT + validé`
- [ ] Badges de statut différenciés
- [ ] Notifications de validation reçues
- [ ] Mise à jour temps réel après validation admin

### Tests à effectuer
- [ ] Validation d'un design avec produits `AUTO_PUBLISH`
- [ ] Validation d'un design avec produits `TO_DRAFT`
- [ ] Publication manuelle d'un produit validé en brouillon
- [ ] Rejet d'un design et vérification cascade
- [ ] Gestion des erreurs 404/403/400

---

**Dernière mise à jour : 2025-01-05** 
 
 
 
 
 

## 1. Logique métier complète

### Cycle de vie d'un design
1. **Création** : Le vendeur crée un design (`isDraft=true`, `isPending=false`, `isValidated=false`)
2. **Soumission** : Le vendeur soumet pour validation (`isPending=true`, `isDraft=false`)
3. **Validation admin** : L'admin valide ou rejette
   - **VALIDATE** : `isValidated=true`, `isPending=false` + cascade vers produits
   - **REJECT** : `isValidated=false`, `isPending=false`, `rejectionReason` rempli

### Cascade vers les produits lors de la validation
Quand un admin valide un design, **TOUS** les produits liés sont automatiquement mis à jour selon le choix du vendeur :

| Choix vendeur (`postValidationAction`) | Nouveau statut produit | `isValidated` | Action possible |
|---------------------------------------|------------------------|---------------|-----------------|
| `AUTO_PUBLISH` | `PUBLISHED` | `true` | Déjà publié, aucune action |
| `TO_DRAFT` | `DRAFT` | `true` | Vendeur peut publier quand il veut |

### Publication manuelle d'un produit validé
- **Condition** : `status=DRAFT` ET `isValidated=true`
- **Action** : Passe en `PUBLISHED` (sans changer `isValidated`)
- **Endpoint** : `POST /vendor-product-validation/publish/{productId}`

---

## 2. Endpoints API

### 2.1 Gestion des designs (Admin)

#### Lister les designs en attente
```
GET /api/designs/admin/pending
```
**Query params :**
- `page` (number, défaut: 1)
- `limit` (number, défaut: 10)
- `search` (string, optionnel)

**Réponse :**
```json
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": 18,
        "name": "solo-leveling-logo-01",
        "description": "Description du design",
        "imageUrl": "https://res.cloudinary.com/...",
        "thumbnailUrl": "https://res.cloudinary.com/...",
        "category": "LOGO",
        "price": 0,
        "tags": ["vendor-created"],
        "createdAt": "2025-01-05T10:30:00Z",
        "vendor": {
          "id": 4,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "shop_name": "John's Designs"
        },
        "linkedProducts": [
          {
            "id": 13,
            "name": "T-shirt avec logo",
            "price": 2500,
            "postValidationAction": "AUTO_PUBLISH"
          }
        ],
        "totalLinkedProducts": 1,
        "autoPublishCount": 1,
        "toDraftCount": 0
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "hasMore": false
    }
  }
}
```

#### Lister tous les designs (avec filtres)
```
GET /api/designs/admin/all
```
**Query params :**
- `page`, `limit`, `search` (comme précédent)
- `status` : `pending` | `validated` | `rejected` | `all`
- `sortBy` : `createdAt` | `name` | `price`
- `sortOrder` : `asc` | `desc`

#### Valider/Rejeter un design
```
PUT /api/designs/{id}/validate
```
**Corps :**
```json
{
  "action": "VALIDATE",           // ou "REJECT"
  "rejectionReason": "Motif..."   // requis si action=REJECT
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Design validé avec succès",
  "data": {
    "id": 18,
    "name": "solo-leveling-logo-01",
    "isValidated": true,
    "isPending": false,
    "validatedAt": "2025-01-05T11:00:00Z",
    "validatedBy": 1
  },
  "cascadeResults": {
    "affectedProducts": 1,
    "publishedProducts": 1,
    "draftProducts": 0
  }
}
```

### 2.2 Gestion des produits (Vendeur)

#### Lister les produits du vendeur
```
GET /vendor-product-validation/products
```
**Query params :**
- `page`, `limit`, `search`
- `status` : `PUBLISHED` | `DRAFT` | `PENDING`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 13,
        "name": "T-shirt avec logo",
        "status": "DRAFT",
        "isValidated": true,
        "validatedAt": "2025-01-05T11:00:00Z",
        "postValidationAction": "TO_DRAFT",
        "designId": 18,
        "designName": "solo-leveling-logo-01",
        "designImageUrl": "https://res.cloudinary.com/...",
        "price": 2500,
        "canPublish": true  // status=DRAFT && isValidated=true
      }
    ]
  }
}
```

#### Publier un produit validé en brouillon
```
POST /vendor-product-validation/publish/{productId}
```
**Conditions :**
- `status = DRAFT`
- `isValidated = true`
- Appartient au vendeur connecté

**Réponse :**
```json
{
  "success": true,
  "message": "Produit publié avec succès",
  "newStatus": "PUBLISHED"
}
```

---

## 3. Logique d'affichage frontend

### 3.1 Interface Admin - Validation des designs

```tsx
// AdminDesignValidation.tsx
const AdminDesignValidation = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPendingDesigns = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/designs/admin/pending', {
        params: { page: 1, limit: 10 }
      });
      setDesigns(response.data.data.designs);
    } catch (error) {
      console.error('Erreur chargement designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateDesign = async (designId: number, action: 'VALIDATE' | 'REJECT', rejectionReason?: string) => {
    try {
      const response = await axios.put(`/api/designs/${designId}/validate`, {
        action,
        rejectionReason
      });
      
      // Afficher le résultat de la cascade
      const { cascadeResults } = response.data;
      alert(`Design ${action === 'VALIDATE' ? 'validé' : 'rejeté'} ! 
        Produits affectés: ${cascadeResults.affectedProducts}
        Publiés automatiquement: ${cascadeResults.publishedProducts}
        Mis en brouillon: ${cascadeResults.draftProducts}`);
      
      // Recharger la liste
      loadPendingDesigns();
    } catch (error) {
      console.error('Erreur validation:', error);
    }
  };

  return (
    <div>
      {designs.map(design => (
        <div key={design.id} className="design-card">
          <img src={design.imageUrl} alt={design.name} />
          <h3>{design.name}</h3>
          <p>Vendeur: {design.vendor.firstName} {design.vendor.lastName}</p>
          <p>Produits liés: {design.totalLinkedProducts}</p>
          <p>Auto-publication: {design.autoPublishCount}</p>
          <p>Vers brouillon: {design.toDraftCount}</p>
          
          <div className="actions">
            <button 
              onClick={() => validateDesign(design.id, 'VALIDATE')}
              className="btn-validate"
            >
              ✅ Valider
            </button>
            <button 
              onClick={() => {
                const reason = prompt('Motif de rejet:');
                if (reason) validateDesign(design.id, 'REJECT', reason);
              }}
              className="btn-reject"
            >
              ❌ Rejeter
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 3.2 Interface Vendeur - Gestion des produits

```tsx
// VendorProductsPage.tsx
const VendorProductsPage = () => {
  const [products, setProducts] = useState([]);

  const loadProducts = async () => {
    try {
      const response = await axios.get('/vendor-product-validation/products');
      setProducts(response.data.data.products);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const publishProduct = async (productId: number) => {
    try {
      const response = await axios.post(`/vendor-product-validation/publish/${productId}`);
      alert(response.data.message);
      loadProducts(); // Recharger la liste
    } catch (error) {
      console.error('Erreur publication:', error);
    }
  };

  const getStatusBadge = (product) => {
    if (product.status === 'PUBLISHED') {
      return <span className="badge badge-success">Publié</span>;
    }
    if (product.status === 'DRAFT' && product.isValidated) {
      return <span className="badge badge-warning">Validé - Prêt à publier</span>;
    }
    if (product.status === 'DRAFT' && !product.isValidated) {
      return <span className="badge badge-secondary">Brouillon</span>;
    }
    return <span className="badge badge-info">En attente</span>;
  };

  return (
    <div>
      <h2>Mes Produits</h2>
      {products.map(product => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          <p>Prix: {product.price / 100} €</p>
          <p>Design: {product.designName}</p>
          {getStatusBadge(product)}
          
          {/* Bouton publier : visible seulement si DRAFT + validé */}
          {product.canPublish && (
            <button 
              onClick={() => publishProduct(product.id)}
              className="btn-publish"
            >
              🚀 Publier maintenant
            </button>
          )}
          
          {/* Informations de validation */}
          {product.isValidated && (
            <p className="validation-info">
              ✅ Validé le {new Date(product.validatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 4. Codes d'erreur et gestion

### Erreurs courantes

| Code | Erreur | Cause | Solution |
|------|--------|-------|---------|
| 400 | Bad Request | Paramètres invalides | Vérifier le corps de la requête |
| 403 | Forbidden | Pas admin ou pas propriétaire | Vérifier l'authentification |
| 404 | Not Found | Design/produit inexistant | Vérifier l'ID |
| 409 | Conflict | Design déjà validé | Recharger les données |

### Gestion des erreurs en TypeScript

```ts
interface ApiError {
  message: string;
  code: string;
  details?: any;
}

const handleApiError = (error: any): string => {
  if (error.response?.status === 400) {
    return 'Données invalides. Vérifiez votre saisie.';
  }
  if (error.response?.status === 403) {
    return 'Accès non autorisé.';
  }
  if (error.response?.status === 404) {
    return 'Élément non trouvé.';
  }
  return 'Erreur inconnue. Veuillez réessayer.';
};
```

---

## 5. Checklist d'intégration

### Pour l'admin
- [ ] Page de liste des designs en attente
- [ ] Boutons Valider/Rejeter avec confirmation
- [ ] Affichage du nombre de produits qui seront affectés
- [ ] Notification du résultat de la cascade
- [ ] Rechargement automatique après action

### Pour le vendeur
- [ ] Liste des produits avec statuts clairs
- [ ] Bouton "Publier" visible seulement si `DRAFT + validé`
- [ ] Badges de statut différenciés
- [ ] Notifications de validation reçues
- [ ] Mise à jour temps réel après validation admin

### Tests à effectuer
- [ ] Validation d'un design avec produits `AUTO_PUBLISH`
- [ ] Validation d'un design avec produits `TO_DRAFT`
- [ ] Publication manuelle d'un produit validé en brouillon
- [ ] Rejet d'un design et vérification cascade
- [ ] Gestion des erreurs 404/403/400

---

**Dernière mise à jour : 2025-01-05** 
 
 
 
 
 

## 1. Logique métier complète

### Cycle de vie d'un design
1. **Création** : Le vendeur crée un design (`isDraft=true`, `isPending=false`, `isValidated=false`)
2. **Soumission** : Le vendeur soumet pour validation (`isPending=true`, `isDraft=false`)
3. **Validation admin** : L'admin valide ou rejette
   - **VALIDATE** : `isValidated=true`, `isPending=false` + cascade vers produits
   - **REJECT** : `isValidated=false`, `isPending=false`, `rejectionReason` rempli

### Cascade vers les produits lors de la validation
Quand un admin valide un design, **TOUS** les produits liés sont automatiquement mis à jour selon le choix du vendeur :

| Choix vendeur (`postValidationAction`) | Nouveau statut produit | `isValidated` | Action possible |
|---------------------------------------|------------------------|---------------|-----------------|
| `AUTO_PUBLISH` | `PUBLISHED` | `true` | Déjà publié, aucune action |
| `TO_DRAFT` | `DRAFT` | `true` | Vendeur peut publier quand il veut |

### Publication manuelle d'un produit validé
- **Condition** : `status=DRAFT` ET `isValidated=true`
- **Action** : Passe en `PUBLISHED` (sans changer `isValidated`)
- **Endpoint** : `POST /vendor-product-validation/publish/{productId}`

---

## 2. Endpoints API

### 2.1 Gestion des designs (Admin)

#### Lister les designs en attente
```
GET /api/designs/admin/pending
```
**Query params :**
- `page` (number, défaut: 1)
- `limit` (number, défaut: 10)
- `search` (string, optionnel)

**Réponse :**
```json
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": 18,
        "name": "solo-leveling-logo-01",
        "description": "Description du design",
        "imageUrl": "https://res.cloudinary.com/...",
        "thumbnailUrl": "https://res.cloudinary.com/...",
        "category": "LOGO",
        "price": 0,
        "tags": ["vendor-created"],
        "createdAt": "2025-01-05T10:30:00Z",
        "vendor": {
          "id": 4,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "shop_name": "John's Designs"
        },
        "linkedProducts": [
          {
            "id": 13,
            "name": "T-shirt avec logo",
            "price": 2500,
            "postValidationAction": "AUTO_PUBLISH"
          }
        ],
        "totalLinkedProducts": 1,
        "autoPublishCount": 1,
        "toDraftCount": 0
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "hasMore": false
    }
  }
}
```

#### Lister tous les designs (avec filtres)
```
GET /api/designs/admin/all
```
**Query params :**
- `page`, `limit`, `search` (comme précédent)
- `status` : `pending` | `validated` | `rejected` | `all`
- `sortBy` : `createdAt` | `name` | `price`
- `sortOrder` : `asc` | `desc`

#### Valider/Rejeter un design
```
PUT /api/designs/{id}/validate
```
**Corps :**
```json
{
  "action": "VALIDATE",           // ou "REJECT"
  "rejectionReason": "Motif..."   // requis si action=REJECT
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Design validé avec succès",
  "data": {
    "id": 18,
    "name": "solo-leveling-logo-01",
    "isValidated": true,
    "isPending": false,
    "validatedAt": "2025-01-05T11:00:00Z",
    "validatedBy": 1
  },
  "cascadeResults": {
    "affectedProducts": 1,
    "publishedProducts": 1,
    "draftProducts": 0
  }
}
```

### 2.2 Gestion des produits (Vendeur)

#### Lister les produits du vendeur
```
GET /vendor-product-validation/products
```
**Query params :**
- `page`, `limit`, `search`
- `status` : `PUBLISHED` | `DRAFT` | `PENDING`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 13,
        "name": "T-shirt avec logo",
        "status": "DRAFT",
        "isValidated": true,
        "validatedAt": "2025-01-05T11:00:00Z",
        "postValidationAction": "TO_DRAFT",
        "designId": 18,
        "designName": "solo-leveling-logo-01",
        "designImageUrl": "https://res.cloudinary.com/...",
        "price": 2500,
        "canPublish": true  // status=DRAFT && isValidated=true
      }
    ]
  }
}
```

#### Publier un produit validé en brouillon
```
POST /vendor-product-validation/publish/{productId}
```
**Conditions :**
- `status = DRAFT`
- `isValidated = true`
- Appartient au vendeur connecté

**Réponse :**
```json
{
  "success": true,
  "message": "Produit publié avec succès",
  "newStatus": "PUBLISHED"
}
```

---

## 3. Logique d'affichage frontend

### 3.1 Interface Admin - Validation des designs

```tsx
// AdminDesignValidation.tsx
const AdminDesignValidation = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPendingDesigns = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/designs/admin/pending', {
        params: { page: 1, limit: 10 }
      });
      setDesigns(response.data.data.designs);
    } catch (error) {
      console.error('Erreur chargement designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateDesign = async (designId: number, action: 'VALIDATE' | 'REJECT', rejectionReason?: string) => {
    try {
      const response = await axios.put(`/api/designs/${designId}/validate`, {
        action,
        rejectionReason
      });
      
      // Afficher le résultat de la cascade
      const { cascadeResults } = response.data;
      alert(`Design ${action === 'VALIDATE' ? 'validé' : 'rejeté'} ! 
        Produits affectés: ${cascadeResults.affectedProducts}
        Publiés automatiquement: ${cascadeResults.publishedProducts}
        Mis en brouillon: ${cascadeResults.draftProducts}`);
      
      // Recharger la liste
      loadPendingDesigns();
    } catch (error) {
      console.error('Erreur validation:', error);
    }
  };

  return (
    <div>
      {designs.map(design => (
        <div key={design.id} className="design-card">
          <img src={design.imageUrl} alt={design.name} />
          <h3>{design.name}</h3>
          <p>Vendeur: {design.vendor.firstName} {design.vendor.lastName}</p>
          <p>Produits liés: {design.totalLinkedProducts}</p>
          <p>Auto-publication: {design.autoPublishCount}</p>
          <p>Vers brouillon: {design.toDraftCount}</p>
          
          <div className="actions">
            <button 
              onClick={() => validateDesign(design.id, 'VALIDATE')}
              className="btn-validate"
            >
              ✅ Valider
            </button>
            <button 
              onClick={() => {
                const reason = prompt('Motif de rejet:');
                if (reason) validateDesign(design.id, 'REJECT', reason);
              }}
              className="btn-reject"
            >
              ❌ Rejeter
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 3.2 Interface Vendeur - Gestion des produits

```tsx
// VendorProductsPage.tsx
const VendorProductsPage = () => {
  const [products, setProducts] = useState([]);

  const loadProducts = async () => {
    try {
      const response = await axios.get('/vendor-product-validation/products');
      setProducts(response.data.data.products);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const publishProduct = async (productId: number) => {
    try {
      const response = await axios.post(`/vendor-product-validation/publish/${productId}`);
      alert(response.data.message);
      loadProducts(); // Recharger la liste
    } catch (error) {
      console.error('Erreur publication:', error);
    }
  };

  const getStatusBadge = (product) => {
    if (product.status === 'PUBLISHED') {
      return <span className="badge badge-success">Publié</span>;
    }
    if (product.status === 'DRAFT' && product.isValidated) {
      return <span className="badge badge-warning">Validé - Prêt à publier</span>;
    }
    if (product.status === 'DRAFT' && !product.isValidated) {
      return <span className="badge badge-secondary">Brouillon</span>;
    }
    return <span className="badge badge-info">En attente</span>;
  };

  return (
    <div>
      <h2>Mes Produits</h2>
      {products.map(product => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          <p>Prix: {product.price / 100} €</p>
          <p>Design: {product.designName}</p>
          {getStatusBadge(product)}
          
          {/* Bouton publier : visible seulement si DRAFT + validé */}
          {product.canPublish && (
            <button 
              onClick={() => publishProduct(product.id)}
              className="btn-publish"
            >
              🚀 Publier maintenant
            </button>
          )}
          
          {/* Informations de validation */}
          {product.isValidated && (
            <p className="validation-info">
              ✅ Validé le {new Date(product.validatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 4. Codes d'erreur et gestion

### Erreurs courantes

| Code | Erreur | Cause | Solution |
|------|--------|-------|---------|
| 400 | Bad Request | Paramètres invalides | Vérifier le corps de la requête |
| 403 | Forbidden | Pas admin ou pas propriétaire | Vérifier l'authentification |
| 404 | Not Found | Design/produit inexistant | Vérifier l'ID |
| 409 | Conflict | Design déjà validé | Recharger les données |

### Gestion des erreurs en TypeScript

```ts
interface ApiError {
  message: string;
  code: string;
  details?: any;
}

const handleApiError = (error: any): string => {
  if (error.response?.status === 400) {
    return 'Données invalides. Vérifiez votre saisie.';
  }
  if (error.response?.status === 403) {
    return 'Accès non autorisé.';
  }
  if (error.response?.status === 404) {
    return 'Élément non trouvé.';
  }
  return 'Erreur inconnue. Veuillez réessayer.';
};
```

---

## 5. Checklist d'intégration

### Pour l'admin
- [ ] Page de liste des designs en attente
- [ ] Boutons Valider/Rejeter avec confirmation
- [ ] Affichage du nombre de produits qui seront affectés
- [ ] Notification du résultat de la cascade
- [ ] Rechargement automatique après action

### Pour le vendeur
- [ ] Liste des produits avec statuts clairs
- [ ] Bouton "Publier" visible seulement si `DRAFT + validé`
- [ ] Badges de statut différenciés
- [ ] Notifications de validation reçues
- [ ] Mise à jour temps réel après validation admin

### Tests à effectuer
- [ ] Validation d'un design avec produits `AUTO_PUBLISH`
- [ ] Validation d'un design avec produits `TO_DRAFT`
- [ ] Publication manuelle d'un produit validé en brouillon
- [ ] Rejet d'un design et vérification cascade
- [ ] Gestion des erreurs 404/403/400

---

**Dernière mise à jour : 2025-01-05** 
 
 
 
 
 