# Documentation: Soft Delete des Produits

## Aperçu
Ce document explique l'implémentation du "soft delete" pour les produits dans l'API Printalma. Le soft delete permet de marquer un produit comme supprimé sans le retirer physiquement de la base de données.

---

## Fonctionnalités implémentées

### 1. Soft Delete (Suppression douce)
- **Endpoint**: `DELETE /products/{id}`
- **Description**: Marque un produit comme supprimé sans le retirer de la base de données
- **Avantages**:
  - Préserve l'historique des données
  - Permet de restaurer facilement les produits
  - Évite les suppressions accidentelles irréversibles

### 2. Restauration de produit
- **Endpoint**: `PATCH /products/{id}/restore`
- **Description**: Restaure un produit précédemment supprimé
- **Cas d'usage**: Annuler une suppression, réactiver un produit temporairement indisponible

### 3. Hard Delete (Suppression définitive)
- **Endpoint**: `DELETE /products/{id}/force`
- **Description**: Supprime définitivement un produit et ses ressources associées
- **Cas d'usage**: Nettoyage de la base de données, conformité RGPD

### 4. Liste des produits supprimés
- **Endpoint**: `GET /products/deleted`
- **Description**: Récupère la liste des produits qui ont été supprimés (soft delete)
- **Cas d'usage**: Gestion des produits, historique, restauration des produits supprimés

---

## Endpoints détaillés

### 1. Soft Delete (Suppression douce)

#### Requête
```http
DELETE /products/42 HTTP/1.1
Host: localhost:3004
Authorization: Bearer YOUR_TOKEN
```

#### Réponse (200 OK)
```json
{
  "message": "Produit avec ID 42 supprimé avec succès",
  "deletedProductId": 42,
  "deletedAt": "2023-05-15T14:30:45.123Z"
}
```

### 2. Restauration de produit

#### Requête
```http
PATCH /products/42/restore HTTP/1.1
Host: localhost:3004
Authorization: Bearer YOUR_TOKEN
```

#### Réponse (200 OK)
```json
{
  "message": "Produit avec ID 42 restauré avec succès",
  "product": {
    "id": 42,
    "name": "T-shirt Design",
    "description": "T-shirt avec design personnalisé",
    "price": 25.99,
    ...
  }
}
```

#### Erreur (400 Bad Request) - Produit non supprimé
```json
{
  "message": "Le produit avec ID 42 n'est pas supprimé",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 3. Hard Delete (Suppression définitive)

#### Requête
```http
DELETE /products/42/force HTTP/1.1
Host: localhost:3004
Authorization: Bearer YOUR_TOKEN
```

#### Réponse (200 OK)
```json
{
  "message": "Produit avec ID 42 supprimé définitivement",
  "deletedProductId": 42
}
```

### 4. Liste des produits supprimés

#### Requête
```http
GET /products/deleted HTTP/1.1
Host: localhost:3004
Authorization: Bearer YOUR_TOKEN
```

#### Réponse (200 OK)
```json
[
  {
    "id": 42,
    "name": "T-shirt Design",
    "description": "T-shirt avec design personnalisé",
    "price": 25.99,
    "deletedAt": "2023-05-15T14:30:45.123Z",
    ...
  },
  {
    "id": 37,
    "name": "Pull personnalisé",
    "description": "Pull chaud et confortable",
    "price": 35.50,
    "deletedAt": "2023-05-14T09:12:33.456Z",
    ...
  }
]
```

---

## Impacts sur les requêtes GET

- Toutes les requêtes de listing (`GET /products`) n'incluent **pas** les produits supprimés
- Les requêtes de détail (`GET /products/{id}`) renvoient 404 pour les produits marqués comme supprimés
- Pour voir les produits supprimés, utilisez `GET /products/deleted`

---

## Implémentation technique

### Base de données
- Ajout d'un champ `deletedAt` (DateTime nullable) au modèle Product
- Quand `deletedAt` est NULL, le produit est actif
- Quand `deletedAt` contient un timestamp, le produit est considéré comme supprimé

### Filtrage automatique
- Toutes les requêtes de liste incluent un filtre `WHERE deletedAt IS NULL`
- Les requêtes individuelles utilisent `findFirst` avec condition `deletedAt IS NULL` au lieu de `findUnique`

---

## Utilisation recommandée

1. **Suppression standard**: Utiliser `DELETE /products/{id}` pour la plupart des cas d'usage
2. **Restauration**: Utiliser `PATCH /products/{id}/restore` pour annuler une suppression
3. **Suppression définitive**: Utiliser `DELETE /products/{id}/force` uniquement pour des cas spécifiques (conformité RGPD, nettoyage de base de données)
4. **Liste des supprimés**: Utiliser `GET /products/deleted` pour voir quels produits ont été supprimés

---

## Exemple d'utilisation (JavaScript/Fetch)

```javascript
// Soft Delete
async function softDeleteProduct(productId) {
  const response = await fetch(`http://localhost:3004/products/${productId}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  });
  return await response.json();
}

// Restauration
async function restoreProduct(productId) {
  const response = await fetch(`http://localhost:3004/products/${productId}/restore`, {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  });
  return await response.json();
}

// Hard Delete
async function hardDeleteProduct(productId) {
  const response = await fetch(`http://localhost:3004/products/${productId}/force`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  });
  return await response.json();
}

// Liste des produits supprimés
async function getDeletedProducts() {
  const response = await fetch(`http://localhost:3004/products/deleted`, {
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  });
  return await response.json();
}
```

---

Pour toute question ou assistance, contactez l'équipe backend. 