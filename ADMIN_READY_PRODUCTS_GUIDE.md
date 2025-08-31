# Guide des Produits Prêts - Admin

## Vue d'ensemble

Les **produits prêts** sont des produits créés par l'admin qui ne nécessitent pas de délimitations. Ils sont prêts à être utilisés directement par les clients sans personnalisation. Ces produits ne sont **pas visibles par les vendeurs** et sont exclusivement gérés par l'administration.

## Différences avec les Produits Mockup

| Aspect | Produits Mockup | Produits Prêts |
|--------|----------------|----------------|
| **Délimitations** | ✅ Requises | ❌ Non nécessaires |
| **Personnalisation** | ✅ Possible | ❌ Non disponible |
| **Visibilité Vendeurs** | ✅ Visible | ❌ Non visible |
| **Gestion** | Admin + Vendeurs | Admin uniquement |
| **Usage** | Templates pour vendeurs | Produits finaux |

## Endpoints API

### 1. Créer un Produit Prêt

**POST** `/products/ready`

**Headers requis:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Body (multipart/form-data):**
- `productData`: JSON string contenant les données du produit
- `file_*`: Images du produit

**Exemple de `productData`:**
```json
{
  "name": "T-Shirt Premium Prêt",
  "description": "Un t-shirt premium prêt à l'emploi",
  "price": 2500,
  "stock": 100,
  "status": "draft",
  "categories": ["T-shirts", "Prêt-à-porter"],
  "sizes": ["S", "M", "L", "XL"],
  "colorVariations": [
    {
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "images": [
        {
          "fileId": "front_white",
          "view": "Front"
        },
        {
          "fileId": "back_white",
          "view": "Back"
        }
      ]
    }
  ]
}
```

**Réponse:**
```json
{
  "id": 123,
  "name": "T-Shirt Premium Prêt",
  "description": "Un t-shirt premium prêt à l'emploi",
  "price": 2500,
  "stock": 100,
  "status": "DRAFT",
  "isReadyProduct": true,
  "categories": [...],
  "sizes": [...],
  "colorVariations": [...]
}
```

### 2. Lister les Produits Prêts

**GET** `/products/ready`

**Headers requis:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `status`: `published` | `draft` | `all` (défaut: `all`)
- `limit`: Nombre de résultats (défaut: 20)
- `offset`: Pagination (défaut: 0)
- `search`: Recherche textuelle

**Exemple:**
```
GET /products/ready?status=published&limit=10&offset=0&search=premium
```

**Réponse:**
```json
{
  "products": [...],
  "total": 50,
  "limit": 10,
  "offset": 0,
  "hasMore": true
}
```

### 3. Récupérer un Produit Prêt Spécifique

**GET** `/products/ready/:id`

**Headers requis:**
```
Authorization: Bearer <admin_token>
```

**Réponse:**
```json
{
  "id": 123,
  "name": "T-Shirt Premium Prêt",
  "description": "Un t-shirt premium prêt à l'emploi",
  "price": 2500,
  "stock": 100,
  "status": "PUBLISHED",
  "isReadyProduct": true,
  "categories": [...],
  "sizes": [...],
  "colorVariations": [
    {
      "id": 1,
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "images": [
        {
          "id": 1,
          "url": "https://res.cloudinary.com/...",
          "view": "Front",
          "naturalWidth": 800,
          "naturalHeight": 600
        }
      ]
    }
  ]
}
```

### 4. Mettre à Jour un Produit Prêt

**PATCH** `/products/ready/:id`

**Headers requis:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "T-Shirt Premium Prêt - Mis à jour",
  "description": "Description mise à jour",
  "price": 3000,
  "stock": 150,
  "status": "published",
  "categories": ["T-shirts", "Prêt-à-porter", "Premium"],
  "sizes": ["XS", "S", "M", "L", "XL", "XXL"]
}
```

### 5. Supprimer un Produit Prêt

**DELETE** `/products/ready/:id`

**Headers requis:**
```
Authorization: Bearer <admin_token>
```

**Réponse:** 204 No Content

## Structure des Données

### CreateReadyProductDto

```typescript
{
  name: string;                    // Nom du produit (2-255 caractères)
  description: string;             // Description (10-5000 caractères)
  price: number;                   // Prix (positif)
  stock?: number;                  // Stock (optionnel, défaut: 0)
  status?: 'published' | 'draft';  // Statut (optionnel, défaut: 'draft')
  categories: string[];            // Catégories (au moins 1)
  sizes?: string[];                // Tailles (optionnel)
  colorVariations: ReadyColorVariationDto[];
}
```

### ReadyColorVariationDto

```typescript
{
  name: string;                    // Nom de la couleur (1-100 caractères)
  colorCode: string;               // Code hexadécimal (#RRGGBB)
  images: ReadyProductImageDto[];
}
```

### ReadyProductImageDto

```typescript
{
  fileId: string;                  // Identifiant unique du fichier
  view: 'Front' | 'Back' | 'Left' | 'Right' | 'Top' | 'Bottom' | 'Detail';
}
```

## Sécurité et Permissions

### Accès Restreint
- **Admin uniquement**: Seuls les utilisateurs avec le rôle `ADMIN` peuvent accéder aux produits prêts
- **Vendeurs exclus**: Les vendeurs ne peuvent pas voir, créer, modifier ou supprimer les produits prêts
- **Validation automatique**: Les produits prêts sont automatiquement validés (pas de workflow de validation)

### Messages d'Erreur
```json
{
  "message": "Seuls les administrateurs peuvent créer des produits prêts.",
  "statusCode": 400
}
```

## Workflow Recommandé

### 1. Création d'un Produit Prêt
1. Préparer les images du produit (Front, Back, etc.)
2. Créer le JSON avec les données du produit
3. Upload via l'endpoint `/products/ready`
4. Vérifier la création dans la liste

### 2. Gestion des Produits Prêts
1. Lister les produits prêts avec filtres
2. Modifier les produits selon les besoins
3. Publier les produits prêts
4. Surveiller les stocks

### 3. Maintenance
1. Mettre à jour les informations des produits
2. Ajuster les prix et stocks
3. Supprimer les produits obsolètes

## Exemples d'Utilisation

### Création avec cURL
```bash
curl -X POST http://localhost:3000/products/ready \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "productData={\"name\":\"T-Shirt Prêt\",\"description\":\"Description\",\"price\":2500,\"categories\":[\"T-shirts\"],\"colorVariations\":[{\"name\":\"Blanc\",\"colorCode\":\"#FFFFFF\",\"images\":[{\"fileId\":\"front\",\"view\":\"Front\"}]}]}" \
  -F "file_front=@front.jpg"
```

### Lister avec JavaScript
```javascript
const response = await fetch('/products/ready?status=published&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
  }
});
const data = await response.json();
console.log(data.products);
```

## Tests

Utilisez le script de test fourni :
```bash
node test-ready-products.js
```

## Notes Importantes

1. **Pas de délimitations**: Les produits prêts n'ont pas de zones de personnalisation
2. **Images requises**: Chaque variation de couleur doit avoir au moins une image
3. **Validation automatique**: Pas de workflow de validation pour les produits prêts
4. **Isolation**: Les produits prêts sont complètement séparés des produits mockup
5. **Performance**: Les requêtes sont optimisées avec des index sur `isReadyProduct`

## Support

Pour toute question ou problème avec les produits prêts, contactez l'équipe de développement. 