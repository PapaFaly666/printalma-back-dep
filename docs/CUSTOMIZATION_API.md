# API Personnalisations - Guide Frontend

Documentation des endpoints API pour la persistance des personnalisations client.

## Base URL

```
/api/customizations
```

---

## 1. Endpoints disponibles

### 1.1 Sauvegarder une personnalisation

```http
POST /customizations
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (optionnel - fonctionne aussi pour les guests)

**Body:**
```json
{
  "productId": 123,
  "colorVariationId": 1,
  "viewId": 5,
  "designElements": [
    {
      "id": "el_1699123456789",
      "type": "text",
      "x": 0.5,
      "y": 0.3,
      "width": 200,
      "height": 50,
      "rotation": 0,
      "zIndex": 0,
      "text": "Mon texte personnalisé",
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
  "sizeSelections": [
    { "size": "M", "quantity": 2 },
    { "size": "L", "quantity": 1 }
  ],
  "sessionId": "guest_abc123",
  "previewImageUrl": "https://res.cloudinary.com/.../preview.png"
}
```

**Query params (optionnel):**
- `customizationId`: ID d'une personnalisation existante à mettre à jour

**Réponse (201):**
```json
{
  "id": 456,
  "productId": 123,
  "colorVariationId": 1,
  "viewId": 5,
  "designElements": [...],
  "sizeSelections": [...],
  "previewImageUrl": "...",
  "totalPrice": "45.99",
  "status": "draft",
  "userId": null,
  "sessionId": "guest_abc123",
  "orderId": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "product": {
    "id": 123,
    "name": "T-shirt Classic",
    "price": "15.99",
    "colorVariations": [...]
  }
}
```

---

### 1.2 Récupérer une personnalisation par ID

```http
GET /customizations/:id
```

**Exemple:**
```javascript
const response = await fetch('/api/customizations/456');
const customization = await response.json();
```

---

### 1.3 Mettre à jour une personnalisation

```http
PUT /customizations/:id
```

**Body (champs optionnels):**
```json
{
  "designElements": [...],
  "sizeSelections": [...],
  "previewImageUrl": "...",
  "status": "draft"
}
```

---

### 1.4 Supprimer une personnalisation

```http
DELETE /customizations/:id
```

---

### 1.5 Récupérer mes personnalisations (utilisateur connecté)

```http
GET /customizations/user/me?status=draft
```

**Headers requis:**
- `Authorization: Bearer <token>`

**Query params:**
- `status` (optionnel): `draft` ou `ordered`

---

### 1.6 Récupérer les personnalisations d'une session (guest)

```http
GET /customizations/session/:sessionId?status=draft
```

**Exemple:**
```javascript
const sessionId = localStorage.getItem('guest-session-id');
const response = await fetch(`/api/customizations/session/${sessionId}?status=draft`);
```

---

### 1.7 Rechercher des personnalisations

```http
GET /customizations/search?productId=123&sessionId=xxx&status=draft
```

**Query params:**
- `productId`: ID du produit
- `sessionId`: ID de session guest
- `userId`: ID utilisateur
- `status`: `draft` ou `ordered`

---

### 1.8 Récupérer le draft d'un produit

```http
GET /customizations/product/:productId/draft?sessionId=xxx
```

Retourne la personnalisation draft la plus récente pour ce produit.

**Exemple:**
```javascript
const sessionId = localStorage.getItem('guest-session-id');
const response = await fetch(`/api/customizations/product/123/draft?sessionId=${sessionId}`);
const draft = await response.json();
// null si aucun draft trouvé
```

---

### 1.9 Upload d'image

```http
POST /customizations/upload-image
Content-Type: multipart/form-data
```

**Body:**
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/customizations/upload-image', {
  method: 'POST',
  body: formData
});
```

**Réponse:**
```json
{
  "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v.../customizations/xxx.png",
  "publicId": "customizations/xxx",
  "width": 500,
  "height": 500
}
```

**Limites:**
- Taille max: 10 MB
- Formats: JPEG, PNG, GIF, WebP, SVG

---

### 1.10 Upload de prévisualisation (base64)

```http
POST /customizations/upload-preview
Content-Type: application/json
```

**Body:**
```json
{
  "imageData": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Réponse:**
```json
{
  "url": "https://res.cloudinary.com/.../preview.png",
  "publicId": "customization-previews/xxx"
}
```

---

### 1.11 Migrer les personnalisations guest vers utilisateur

```http
POST /customizations/migrate
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "sessionId": "guest_abc123"
}
```

**Réponse:**
```json
{
  "migrated": 3,
  "customizations": [...]
}
```

**Usage:** Appeler cette méthode après la connexion/inscription pour transférer les personnalisations.

---

## 2. Structures de données

### 2.1 TextElement

```typescript
interface TextElement {
  id: string;                              // UUID unique (ex: "el_1699123456789")
  type: 'text';
  x: number;                               // Position X (0-1, 0.5 = centre)
  y: number;                               // Position Y (0-1)
  width: number;                           // Largeur en pixels
  height: number;                          // Hauteur en pixels
  rotation: number;                        // Rotation en degrés
  zIndex: number;                          // Ordre d'affichage
  text: string;                            // Contenu (max 500 caractères)
  fontSize: number;                        // Taille police (8-200)
  baseFontSize: number;                    // Taille de base pour scaling
  baseWidth: number;                       // Largeur de base
  fontFamily: string;                      // Ex: "Arial", "Roboto"
  color: string;                           // Couleur hex (#RRGGBB)
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  curve: number;                           // Courbure (-355 à 355)
}
```

### 2.2 ImageElement

```typescript
interface ImageElement {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  imageUrl: string;                        // URL Cloudinary
  naturalWidth: number;                    // Largeur originale
  naturalHeight: number;                   // Hauteur originale
}
```

### 2.3 SizeSelection

```typescript
interface SizeSelection {
  size: string;      // "S", "M", "L", "XL"
  quantity: number;
}
```

---

## 3. Exemple d'implémentation frontend

### 3.1 Service de personnalisation

```typescript
// services/customizationService.ts

const API_URL = '/api/customizations';

export const customizationService = {
  // Sauvegarder une personnalisation
  async save(data: CreateCustomizationDto): Promise<Customization> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save customization');
    }

    return response.json();
  },

  // Récupérer par ID
  async getById(id: number): Promise<Customization> {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Customization not found');
    return response.json();
  },

  // Récupérer le draft pour un produit
  async getDraft(productId: number): Promise<Customization | null> {
    const sessionId = localStorage.getItem('guest-session-id');
    const token = localStorage.getItem('auth_token');

    const url = `${API_URL}/product/${productId}/draft?sessionId=${sessionId || ''}`;
    const response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!response.ok) return null;
    return response.json();
  },

  // Upload d'image
  async uploadImage(file: File): Promise<{ url: string; width: number; height: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload-image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  // Upload de prévisualisation
  async uploadPreview(base64Data: string): Promise<{ url: string }> {
    const response = await fetch(`${API_URL}/upload-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData: base64Data })
    });

    if (!response.ok) throw new Error('Preview upload failed');
    return response.json();
  },

  // Migrer après connexion
  async migrateGuestData(): Promise<void> {
    const sessionId = localStorage.getItem('guest-session-id');
    const token = localStorage.getItem('auth_token');

    if (!sessionId || !token) return;

    await fetch(`${API_URL}/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sessionId })
    });

    // Nettoyer la session guest après migration
    localStorage.removeItem('guest-session-id');
  }
};
```

### 3.2 Utilisation dans un composant

```typescript
// Sauvegarder la personnalisation
const handleSave = async () => {
  try {
    const sessionId = getOrCreateSessionId();

    const result = await customizationService.save({
      productId,
      colorVariationId: selectedColor.id,
      viewId: currentView.id,
      designElements: elements,
      sizeSelections: selectedSizes,
      sessionId,
      previewImageUrl: await generatePreview()
    });

    // Sauvegarder l'ID pour référence
    saveCustomizationId(productId, result.id);

    console.log('Personnalisation sauvegardée:', result.id);
  } catch (error) {
    console.error('Erreur:', error.message);
  }
};

// Générer et uploader la prévisualisation
const generatePreview = async (): Promise<string> => {
  const canvas = canvasRef.current;
  const base64 = canvas.toDataURL('image/png');
  const { url } = await customizationService.uploadPreview(base64);
  return url;
};

// Charger un draft existant
const loadDraft = async () => {
  const draft = await customizationService.getDraft(productId);
  if (draft) {
    setElements(draft.designElements);
    setSelectedSizes(draft.sizeSelections || []);
  }
};

// Générer/récupérer un session ID pour les guests
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('guest-session-id');
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guest-session-id', sessionId);
  }
  return sessionId;
};
```

### 3.3 Upload d'image utilisateur

```typescript
const handleImageUpload = async (file: File) => {
  try {
    // Vérifications côté client
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Image trop volumineuse (max 10MB)');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Format non supporté');
    }

    // Upload
    const { url, width, height } = await customizationService.uploadImage(file);

    // Créer l'élément image
    const imageElement: ImageElement = {
      id: `el_${Date.now()}`,
      type: 'image',
      x: 0.5,
      y: 0.5,
      width: Math.min(width, 300),
      height: Math.min(height, 300),
      rotation: 0,
      zIndex: elements.length,
      imageUrl: url,
      naturalWidth: width,
      naturalHeight: height
    };

    setElements([...elements, imageElement]);
  } catch (error) {
    alert(error.message);
  }
};
```

---

## 4. Gestion des erreurs

### Codes d'erreur courants

| Code | Message | Solution |
|------|---------|----------|
| 400 | Invalid design elements | Vérifier la structure des éléments |
| 400 | File size exceeds 10MB | Compresser l'image |
| 400 | Invalid file type | Utiliser JPEG/PNG/GIF/WebP/SVG |
| 404 | Product not found | Vérifier l'ID du produit |
| 404 | Customization not found | L'ID n'existe pas |

### Exemple de gestion d'erreur

```typescript
try {
  await customizationService.save(data);
} catch (error) {
  if (error.message.includes('Invalid design elements')) {
    // Erreur de validation
    console.error('Validation errors:', error.errors);
  } else if (error.message.includes('not found')) {
    // Ressource introuvable
    router.push('/404');
  } else {
    // Erreur générique
    toast.error('Une erreur est survenue');
  }
}
```

---

## 5. Bonnes pratiques

### 5.1 Session ID pour les guests

```typescript
// Toujours vérifier/créer au démarrage de l'app
useEffect(() => {
  if (!localStorage.getItem('guest-session-id')) {
    const id = `guest_${Date.now()}_${crypto.randomUUID()}`;
    localStorage.setItem('guest-session-id', id);
  }
}, []);
```

### 5.2 Migration après connexion

```typescript
// Dans le callback de connexion réussie
const onLoginSuccess = async () => {
  await customizationService.migrateGuestData();
  // Rafraîchir les données
  await loadUserCustomizations();
};
```

### 5.3 Sauvegarde automatique

```typescript
// Debounce pour éviter trop d'appels API
const debouncedSave = useMemo(
  () => debounce(async (elements) => {
    await customizationService.save({
      productId,
      colorVariationId,
      viewId,
      designElements: elements,
      sessionId: getOrCreateSessionId()
    });
  }, 2000),
  [productId, colorVariationId, viewId]
);

// Sauvegarder à chaque modification
useEffect(() => {
  if (elements.length > 0) {
    debouncedSave(elements);
  }
}, [elements]);
```

### 5.4 Coordonnées relatives

Les coordonnées x et y sont en pourcentage (0-1) pour s'adapter à différentes tailles d'écran:

```typescript
// Conversion pixels → pourcentage
const toRelative = (px: number, containerSize: number) => px / containerSize;

// Conversion pourcentage → pixels
const toAbsolute = (relative: number, containerSize: number) => relative * containerSize;

// Exemple
const element = {
  x: toRelative(mouseX, canvasWidth),  // 0.5 si au milieu
  y: toRelative(mouseY, canvasHeight)
};
```

---

## 6. Intégration avec le panier

Lors de l'ajout au panier, inclure les IDs de personnalisation:

```typescript
const addToCart = async () => {
  // Sauvegarder d'abord la personnalisation
  const customization = await customizationService.save({
    productId,
    colorVariationId,
    viewId,
    designElements: elements,
    sizeSelections: selectedSizes,
    sessionId: getOrCreateSessionId(),
    previewImageUrl: await generatePreview()
  });

  // Ajouter au panier avec référence
  const cartItem = {
    productId,
    name: product.name,
    price: customization.totalPrice,
    color: selectedColor.name,
    colorCode: selectedColor.colorCode,
    size: selectedSizes[0].size,
    quantity: selectedSizes[0].quantity,
    imageUrl: customization.previewImageUrl,
    customizationId: customization.id,
    designElementsByView: {
      [`${colorVariationId}-${viewId}`]: elements
    }
  };

  addItemToCart(cartItem);
};
```

---

## 7. Support

Pour toute question sur l'API:
- Swagger UI: `/api/docs`
- Contact: équipe backend
