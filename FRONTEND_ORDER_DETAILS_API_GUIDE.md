# 📄 Guide API Frontend: Réponses Détaillées des Commandes avec Informations Produit Ciblées

## 🎯 Vue d'Ensemble

Ce document détaille la structure des réponses des endpoints de commande (`GET /orders`, `GET /orders/:id`, `GET /orders/my-orders`, etc.). Chaque produit dans un item de commande (`OrderItem`) expose maintenant des informations ciblées : l'image principale de son design et les détails spécifiques de la couleur qui a été commandée.

**Objectif :** Permettre au frontend d'afficher les informations visuelles essentielles du produit tel qu'il a été commandé, de manière concise.

---

## 📚 Structure Principale de Réponse (`OrderResponseDto`)

La structure globale d'une commande reste la même.

```json
// Exemple de structure pour un objet OrderResponseDto
{
  "id": 123,
  "orderNumber": "CMD20241127001",
  "userId": 42,
  "user": {
    "id": 42,
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "role": "USER",
    "photo_profil": "https://example.com/path/to/avatar.jpg"
  },
  "status": "CONFIRMED",
  "totalAmount": 89.99,
  "shippingAddress": {
    "name": "Jean Dupont",
    "street": "123 Rue Principale, Appt 4B",
    "city": "Rufisque",
    "region": "Dakar",
    "postalCode": "12500",
    "country": "Sénégal",
    "fullFormatted": "Jean Dupont\n123 Rue Principale, Appt 4B\nRufisque, Dakar, 12500\nSénégal"
  },
  "phoneNumber": "771234567",
  "notes": "Ceci est une note pour la commande.",
  "createdAt": "2023-01-15T10:00:00.000Z",
  "updatedAt": "2023-01-15T10:30:00.000Z",
  "validatedAt": "2023-01-15T10:25:00.000Z",
  "validatedBy": 10,
  "validator": {
    "id": 10,
    "firstName": "Admin",
    "lastName": "PrintAlma"
  },
  "orderItems": [
    // ... voir la section OrderItemResponseDto ci-dessous ...
  ]
}
```

---

## 📦 Structure d'un Item de Commande (`OrderItemResponseDto`)

Chaque item dans le tableau `orderItems` a la structure suivante :

```json
// Exemple de structure pour un objet OrderItemResponseDto
{
  "id": 501,
  "quantity": 2,
  "unitPrice": 25.00,
  "size": "M",     // Taille sélectionnée pour cet item spécifique
  "color": "Bleu Ciel", // Couleur sélectionnée (nom ou code) pour cet item spécifique
  "product": {
    // ... voir la section ProductInOrderResponseDto ci-dessous ...
  }
}
```

---

## 👕 Structure Ciblée du Produit (`ProductInOrderResponseDto`)

L'objet `product` à l'intérieur de chaque `OrderItemResponseDto` aura maintenant cette structure simplifiée, axée sur le design et la couleur commandée :

```json
// Exemple de structure pour un objet ProductInOrderResponseDto
{
  "id": 789,
  "name": "T-Shirt Personnalisé Printemps",
  "description": "Un t-shirt confortable avec votre design unique pour la saison printanière.",
  "price": 25.00, // Prix unitaire de base du produit
  "designName": "Fleurs de Printemps",
  "designDescription": "Un design floral coloré et vibrant.",
  "designImageUrl": "https://example.com/designs/fleurs_printemps_main.jpg", // Image principale du design
  "categoryId": 3,
  "categoryName": "T-Shirts",
  "orderedColorName": "Bleu Ciel",            // Nom de la couleur commandée
  "orderedColorHexCode": "#87CEEB",         // Code Hex de la couleur commandée (si disponible)
  "orderedColorImageUrl": "https://example.com/colors/bleu_ciel_texture.jpg" // Image spécifique de la couleur commandée (si disponible)
}
```

**Explication des Champs Clés du Produit :**

*   `designImageUrl`: URL de l'image principale ou représentative du design appliqué au produit.
*   `orderedColorName`: Le nom de la couleur telle que sélectionnée par le client pour cet item.
*   `orderedColorHexCode`: Le code hexadécimal de la couleur commandée, utile pour afficher un aplat de couleur si `orderedColorImageUrl` n'est pas fourni.
*   `orderedColorImageUrl`: Si la couleur commandée a une image spécifique (par exemple, une texture, un motif de couleur particulier), son URL sera ici. Peut être `null`.

Les listes détaillées de toutes les vues du produit, toutes les couleurs disponibles et toutes les tailles disponibles ne sont **plus incluses** dans la réponse de la commande pour alléger le payload et se concentrer sur ce qui a été spécifiquement commandé.

---

## 🚀 Exemple Complet d'un `orderItem` (Structure Simplifiée)

Voici un exemple d'un `orderItem` complet avec son produit dans la nouvelle structure :

```json
{
  "id": 501,
  "quantity": 1,
  "unitPrice": 30.00,
  "size": "L",
  "color": "Noir", // Couleur commandée pour cet item
  "product": {
    "id": 789,
    "name": "Sweat à Capuche Design Urbain",
    "description": "Confortable et stylé, parfait pour un look urbain.",
    "price": 30.00,
    "designName": "Graffiti Skyline",
    "designDescription": "Un design dynamique inspiré des graffitis et des horizons de ville.",
    "designImageUrl": "https://example.com/designs/sweat_urbain_main.jpg",
    "categoryId": 5,
    "categoryName": "Sweats",
    "orderedColorName": "Noir",
    "orderedColorHexCode": "#000000",
    "orderedColorImageUrl": null // Supposons que la couleur noire n'a pas d'image spécifique ici
  }
}
```

---

## ✨ Conseils pour l'Intégration Frontend

*   **Affichage des Détails de la Commande :**
    *   Affichez `product.designImageUrl` comme image principale du produit commandé.
    *   Si `product.orderedColorImageUrl` est disponible, vous pouvez l'afficher (par exemple, comme une petite vignette ou si le design lui-même est une couleur unie texturée).
    *   Utilisez `product.orderedColorName` et `product.orderedColorHexCode` pour afficher le nom de la couleur et un échantillon visuel.
*   **Informations sur la Sélection :** Rappelez clairement la `taille` (`orderItem.size`) et la `couleur` (`orderItem.color` ou `product.orderedColorName`) qui ont été spécifiquement choisies pour l'item de commande.
*   **Liens vers les Produits :** L'`id` du produit peut toujours être utilisé pour créer des liens vers la page détaillée du produit sur le site (si applicable), où l'utilisateur pourrait voir toutes les vues, couleurs et tailles.
*   **Informations de Design et Catégorie :** Utilisez `designName`, `designDescription`, `categoryName` pour un affichage contextuel.

Ce guide mis à jour devrait aider votre équipe frontend à exploiter les informations produit ciblées désormais disponibles dans les réponses des commandes. 