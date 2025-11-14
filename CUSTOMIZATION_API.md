# 🎨 API de Personnalisation de Produits - Guide d'Utilisation

## 📋 Vue d'ensemble

L'API de personnalisation permet aux clients (connectés ou invités) de sauvegarder leurs designs personnalisés sur les produits avant de passer commande.

## 🚀 Endpoints Disponibles

### Base URL
```
http://localhost:3004
```

---

## 1. 💾 Sauvegarder une personnalisation

**Endpoint:** `POST /customizations?customizationId={id}`

**Authentification:** Optionnelle (fonctionne avec ou sans JWT)

**Description:** Crée ou met à jour une personnalisation. Si une personnalisation existe déjà pour le même produit/utilisateur/session, elle sera mise à jour.

**Query Parameters (optionnel):**
- `customizationId`: ID de la personnalisation à mettre à jour spécifiquement. Si fourni, met à jour cette personnalisation précise au lieu de chercher un draft existant.

### Request Body

```json
{
  "productId": 1,
  "colorVariationId": 1,
  "viewId": 1,
  "designElements": [
    {
      "id": "text-1",
      "type": "text",
      "x": 0.5,
      "y": 0.5,
      "width": 200,
      "height": 50,
      "rotation": 0,
      "zIndex": 1,
      "text": "Hello World",
      "fontSize": 24,
      "baseFontSize": 24,
      "baseWidth": 200,
      "fontFamily": "Arial",
      "color": "#000000",
      "fontWeight": "normal",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "center",
      "curve": 0
    },
    {
      "id": "image-1",
      "type": "image",
      "x": 0.3,
      "y": 0.7,
      "width": 150,
      "height": 150,
      "rotation": 0,
      "zIndex": 2,
      "imageUrl": "https://example.com/image.png",
      "naturalWidth": 800,
      "naturalHeight": 800
    }
  ],
  "sizeSelections": [
    {
      "size": "M",
      "quantity": 2
    },
    {
      "size": "L",
      "quantity": 1
    }
  ],
  "sessionId": "guest-1234567890",
  "previewImageUrl": "https://example.com/mockup.png"
}
```

### Exemple cURL (Guest)

```bash
curl -X POST http://localhost:3004/customizations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "colorVariationId": 1,
    "viewId": 1,
    "designElements": [
      {
        "id": "text-1",
        "type": "text",
        "x": 0.5,
        "y": 0.5,
        "width": 200,
        "height": 50,
        "rotation": 0,
        "zIndex": 1,
        "text": "Hello World",
        "fontSize": 24,
        "baseFontSize": 24,
        "baseWidth": 200,
        "fontFamily": "Arial",
        "color": "#000000",
        "fontWeight": "normal",
        "fontStyle": "normal",
        "textDecoration": "none",
        "textAlign": "center",
        "curve": 0
      }
    ],
    "sessionId": "guest-test-1234567890"
  }'
```

### Exemple cURL (Utilisateur connecté)

```bash
curl -X POST http://localhost:3004/customizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": 1,
    "colorVariationId": 1,
    "viewId": 1,
    "designElements": [...]
  }'
```

### Response

```json
{
  "id": 1,
  "userId": null,
  "sessionId": "guest-test-1234567890",
  "productId": 1,
  "colorVariationId": 1,
  "viewId": 1,
  "designElements": [...],
  "sizeSelections": [...],
  "previewImageUrl": null,
  "totalPrice": 60.00,
  "status": "draft",
  "orderId": null,
  "createdAt": "2025-01-13T10:00:00.000Z",
  "updatedAt": "2025-01-13T10:00:00.000Z",
  "product": {
    "id": 1,
    "name": "T-Shirt Classic",
    "price": 20.00,
    "colorVariations": [...]
  }
}
```


---

## 2. 🔍 Récupérer une personnalisation par ID

**Endpoint:** `GET /customizations/:id`

**Authentification:** Non requise

### Exemple

```bash
curl http://localhost:3004/customizations/1
```

---

## 3. 👤 Récupérer les personnalisations d'un utilisateur

**Endpoint:** `GET /customizations/user/me?status=draft`

**Authentification:** Requise (JWT)

**Query Parameters:**
- `status` (optionnel): Filtrer par statut (draft, saved, ordered)

### Exemple

```bash
curl http://localhost:3004/customizations/user/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 4. 👥 Récupérer les personnalisations d'une session (guest)

**Endpoint:** `GET /customizations/session/:sessionId?status=draft`

**Authentification:** Non requise

**Query Parameters:**
- `status` (optionnel): Filtrer par statut

### Exemple

```bash
curl http://localhost:3004/customizations/session/guest-test-1234567890
```

---

## 5. ✏️ Mettre à jour une personnalisation

**Endpoint:** `PUT /customizations/:id`

**Authentification:** Optionnelle

### Request Body

```json
{
  "designElements": [...],
  "sizeSelections": [...],
  "previewImageUrl": "https://example.com/new-mockup.png",
  "status": "saved"
}
```

### Exemple

```bash
curl -X PUT http://localhost:3004/customizations/1 \
  -H "Content-Type: application/json" \
  -d '{
    "designElements": [
      {
        "id": "text-1",
        "type": "text",
        "text": "Updated Text",
        ...
      }
    ]
  }'
```

---

## 6. 🗑️ Supprimer une personnalisation

**Endpoint:** `DELETE /customizations/:id`

**Authentification:** Optionnelle

### Exemple

```bash
curl -X DELETE http://localhost:3004/customizations/1
```

---

## 7. 🔄 Migrer les personnalisations guest vers un utilisateur

**Endpoint:** `POST /customizations/migrate`

**Authentification:** Requise (JWT)

**Description:** Lors de la connexion ou de l'inscription d'un utilisateur qui avait des personnalisations en tant que guest, cet endpoint migre automatiquement toutes ses personnalisations vers son compte utilisateur.

### Request Body

```json
{
  "sessionId": "guest-1234567890"
}
```

### Exemple

```bash
curl -X POST http://localhost:3004/customizations/migrate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"sessionId": "guest-1234567890"}'
```

### Response

```json
{
  "migrated": 3,
  "customizations": [
    {
      "id": 1,
      "userId": 42,
      "sessionId": null,
      "productId": 1,
      "status": "draft",
      ...
    },
    ...
  ]
}
```

### Utilisation Frontend

```typescript
// Lors de la connexion réussie
const sessionId = localStorage.getItem('guest-session-id');

if (sessionId) {
  const token = localStorage.getItem('auth-token');

  const response = await fetch('http://localhost:3004/customizations/migrate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ sessionId })
  });

  const result = await response.json();
  console.log(`${result.migrated} personnalisations migrées`);

  // Nettoyer le sessionId
  localStorage.removeItem('guest-session-id');
}
```

---

## 8. 📄 Récupérer le draft d'un produit spécifique

**Endpoint:** `GET /customizations/product/:productId/draft`

**Authentification:** Optionnelle

**Description:** Récupère la personnalisation draft la plus récente pour un produit donné. Utile pour continuer une personnalisation en cours.

**Query Parameters:**
- `sessionId` (requis pour guests): ID de session pour les utilisateurs non connectés

### Exemple (Utilisateur connecté)

```bash
curl http://localhost:3004/customizations/product/1/draft \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Exemple (Guest)

```bash
curl "http://localhost:3004/customizations/product/1/draft?sessionId=guest-1234567890"
```

### Response

```json
{
  "id": 5,
  "productId": 1,
  "userId": 42,
  "designElements": [...],
  "status": "draft",
  "updatedAt": "2025-01-13T10:30:00.000Z",
  "product": {...}
}
```

### Utilisation Frontend

```typescript
// Charger une personnalisation existante pour continuer
const productId = 123;
const sessionId = localStorage.getItem('guest-session-id');
const token = localStorage.getItem('auth-token');

const url = token
  ? `http://localhost:3004/customizations/product/${productId}/draft`
  : `http://localhost:3004/customizations/product/${productId}/draft?sessionId=${sessionId}`;

const headers = {
  ...(token && { 'Authorization': `Bearer ${token}` })
};

const response = await fetch(url, { headers });
const draft = await response.json();

if (draft) {
  // Restaurer la personnalisation
  setDesignElements(draft.designElements);
  setCustomizationId(draft.id);
}
```

---

## 📝 Types de données

### TextElement

```typescript
{
  id: string;
  type: 'text';
  x: number;          // Position en % (0-1)
  y: number;          // Position en % (0-1)
  width: number;      // Largeur en pixels
  height: number;     // Hauteur en pixels
  rotation: number;   // Rotation en degrés
  zIndex: number;     // Ordre d'affichage
  text: string;
  fontSize: number;
  baseFontSize: number;
  baseWidth: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  curve: number;      // Courbure du texte (-355 à 355)
}
```

### ImageElement

```typescript
{
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
}
```

### SizeSelection

```typescript
{
  size: string;      // "XS", "S", "M", "L", "XL", etc.
  quantity: number;  // Quantité
}
```

---

## 🧪 Test rapide

Pour tester rapidement tous les endpoints:

```bash
./test-customization.sh
```

Ou manuellement:

```bash
# 1. Créer une personnalisation
curl -X POST http://localhost:3004/customizations \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "colorVariationId": 1, "viewId": 1, "designElements": [...], "sessionId": "guest-123"}'

# 2. Récupérer les personnalisations
curl http://localhost:3004/customizations/session/guest-123
```

---

## 🔐 Authentification

L'API supporte deux modes:

1. **Utilisateur connecté**: Ajouter le header `Authorization: Bearer YOUR_JWT_TOKEN`
   - Les personnalisations sont liées au `userId`
   - Le `sessionId` est ignoré

2. **Invité (guest)**: Pas de header d'authentification
   - Les personnalisations sont liées au `sessionId`
   - Générer un `sessionId` unique côté client (ex: `guest-${timestamp}-${random}`)

---

## 📊 Statuts des personnalisations

- `draft`: Brouillon en cours de création
- `saved`: Sauvegardée par l'utilisateur
- `ordered`: Incluse dans une commande

---

## 💡 Stratégie de sauvegarde recommandée

Pour obtenir les meilleures performances tout en garantissant la persistance des données, utilisez une **stratégie hybride** :

### 1. localStorage (Sauvegarde immédiate)
```typescript
// À chaque modification
useEffect(() => {
  if (!isRestoring && designElements.length > 0) {
    const storageKey = `design-data-product-${productId}`;
    localStorage.setItem(storageKey, JSON.stringify({
      elements: designElements,
      colorVariationId: selectedColorVariation?.id,
      viewId: selectedView?.id,
      customizationId: customizationId,
      timestamp: Date.now()
    }));
  }
}, [designElements, selectedColorVariation, selectedView]);
```

### 2. Base de données (Sauvegarde debounced)
```typescript
// Hook de debounce
const useDebouncedSave = (saveFunction, delay = 3000) => {
  const timeoutRef = useRef();

  return useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(saveFunction, delay);
  }, [saveFunction, delay]);
};

// Utilisation
const debouncedSaveToDatabase = useDebouncedSave(saveToDatabase, 3000);

useEffect(() => {
  if (!isRestoring && designElements.length > 0) {
    // 1. localStorage (immédiat)
    saveToLocalStorage();

    // 2. BDD (après 3s d'inactivité)
    debouncedSaveToDatabase();
  }
}, [designElements]);
```

### 3. Sauvegarde immédiate BDD (Actions critiques)
```typescript
// Lors de l'ajout au panier
const handleAddToCart = async () => {
  // Sauvegarder IMMÉDIATEMENT en BDD
  const result = await saveToDatabase();

  if (!result) {
    toast.error('Erreur de sauvegarde');
    return;
  }

  // Ajouter au panier avec customizationId
  await addToCart({ customizationId: result.id, ... });
};
```

### Avantages de cette approche

| Stratégie | Vitesse | Fiabilité | Cross-device |
|-----------|---------|-----------|--------------|
| localStorage seul | ⭐⭐⭐⭐⭐ | ⭐⭐ | ❌ |
| BDD debounced | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |
| **Hybride** ✨ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |

---

## ⚠️ Notes importantes

1. **SessionId**: Pour les guests, toujours générer et stocker le même `sessionId` en localStorage
2. **Upsert**: Une seule personnalisation `draft` par produit/utilisateur/session. Les sauvegardes successives mettent à jour l'existante.
3. **customizationId**: Sauvegarder l'ID retourné après la première sauvegarde pour les mises à jour ultérieures
4. **Prix total**: Calculé automatiquement en backend (quantité × prix produit)
5. **Relations**: Les personnalisations incluent automatiquement les données du produit et des variations de couleur
6. **Migration**: Appeler l'endpoint `/migrate` lors de la connexion pour transférer les données guest
7. **Index optimisés**: La base de données possède des index composés pour des requêtes ultra-rapides

---

## 🚀 Démarrage du serveur

```bash
# Démarrer le serveur
npm run start:dev

# Le serveur démarre sur http://localhost:3004
```

---

## 📚 Ressources

- **Swagger UI**: `http://localhost:3004/api` (une fois le serveur démarré)
- **Documentation complète**: Voir `docs/customization-guide.md`
