# Documentation: Suppression de produits

## Aperçu
Ce document explique comment supprimer un produit et ses données associées dans l'API Printalma.

---

## Endpoint: DELETE /products/{id}

L'API permet de supprimer un produit via un appel DELETE, qui supprime également:
- Les vues du produit (ProductView)
- Les couleurs exclusivement associées à ce produit
- Les images Cloudinary des couleurs supprimées

### Paramètres:
- `id` (obligatoire) - L'identifiant numérique du produit à supprimer
}+
### Exemple de requête:
```http
DELETE /products/42 HTTP/1.1
Host: localhost:3004
Authorization: Bearer YOUR_TOKEN
```

### Réponse en cas de succès (200 OK):
```json
{
  "message": "Produit avec ID 42 supprimé avec succès",
  "deletedProductId": 42
}
```

### Réponses d'erreur:
- **404 Not Found**: Le produit demandé n'existe pas
```json
{
  "message": "Product with ID 42 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

- **400 Bad Request**: Erreur lors de la suppression
```json
{
  "message": "Erreur lors de la suppression du produit: [détails de l'erreur]",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## Comportement de la suppression

### 1. Vérification du produit
Le système vérifie d'abord que le produit existe.

### 2. Suppression des vues
Toutes les vues (ProductView) associées au produit sont supprimées.

### 3. Identification des couleurs exclusives
Le système identifie les couleurs utilisées uniquement par ce produit.

### 4. Suppression du produit
Le produit est supprimé de la base de données.

### 5. Nettoyage des couleurs
Les couleurs qui n'étaient utilisées que par ce produit sont supprimées:
- L'image Cloudinary associée est supprimée
- L'entrée de la couleur est supprimée de la base de données

### 6. Conservation des relations partagées
Les entités suivantes sont conservées si elles sont partagées avec d'autres produits:
- Couleurs utilisées par d'autres produits
- Catégories
- Tailles

---

## Exemple d'utilisation (JavaScript/Fetch)

```javascript
async function deleteProduct(productId) {
  try {
    const response = await fetch(`http://localhost:3004/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la suppression');
    }
    
    const result = await response.json();
    console.log('Produit supprimé avec succès:', result);
    return result;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}
```

---

## Remarques importantes

1. **Opération irréversible**: La suppression est définitive et ne peut pas être annulée.
2. **Suppression conditionnelle des couleurs**: Seules les couleurs exclusives au produit sont supprimées.
3. **Images Cloudinary**: Les images des couleurs supprimées sont également supprimées de Cloudinary pour libérer de l'espace.

---

Pour toute question ou assistance, contactez l'équipe backend. 