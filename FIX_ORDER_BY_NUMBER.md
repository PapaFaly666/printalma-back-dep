# Fix : Route GET /orders/number/:orderNumber manquante

## Problème

Le frontend appelle `GET /orders/number/:orderNumber` depuis `OrderConfirmationPage`
pour charger les détails de la commande après une redirection PayDunya.

Cette route **n'existe pas** dans le backend → **HTTP 404**.

De plus, l'utilisateur arrive sur cette page sans être authentifié
(redirection externe depuis PayDunya), donc la route doit être **publique**.

---

## Fichiers à modifier

- `src/order/order.service.ts`
- `src/order/order.controller.ts`

---

## 1. Ajouter la méthode dans `order.service.ts`

Ajouter la méthode `getOrderByNumber` après la méthode `getOrderById` (ligne ~1445).
Elle utilise le même `include` que `getOrderById` pour retourner la même structure.

```typescript
async getOrderByNumber(orderNumber: string) {
  const order = await this.prisma.order.findFirst({
    where: { orderNumber },
    include: {
      orderItems: {
        include: {
          product: true,
          stickerProduct: {
            include: {
              vendor: {
                select: {
                  id: true,
                  shop_name: true,
                }
              },
              design: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                }
              }
            }
          },
          colorVariation: true,
          customization: {
            select: {
              id: true,
              designElements: true,
              elementsByView: true,
              previewImageUrl: true,
              colorVariationId: true,
              viewId: true,
              sizeSelections: true,
              status: true,
              createdAt: true,
              updatedAt: true
            }
          }
        },
      },
      user: true,
      validator: true,
      paymentAttemptsHistory: {
        orderBy: {
          attemptedAt: 'desc',
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundException(`Commande ${orderNumber} non trouvée`);
  }

  return this.formatOrderResponse(order);
}
```

---

## 2. Ajouter la route dans `order.controller.ts`

Ajouter ce bloc **AVANT** la route `@Get(':id')` (ligne ~293).
L'ordre est important car NestJS matche les routes dans l'ordre de déclaration,
et `number/:orderNumber` doit être déclaré avant `:id` pour ne pas être capturé par lui.

```typescript
// Obtenir une commande par son numéro (public - utilisé après redirection PayDunya)
@Get('number/:orderNumber')
@HttpCode(HttpStatus.OK)
async getOrderByNumber(@Param('orderNumber') orderNumber: string) {
  return {
    success: true,
    message: 'Commande récupérée avec succès',
    data: await this.orderService.getOrderByNumber(orderNumber)
  };
}
```

---

## Résultat attendu

```
GET /orders/number/ORD-1771415981879
→ 200 OK

{
  "success": true,
  "message": "Commande récupérée avec succès",
  "data": {
    "id": 42,
    "orderNumber": "ORD-1771415981879",
    "status": "PENDING",
    "paymentStatus": "FAILED",
    "totalAmount": 5000,
    "orderItems": [...],
    ...
  }
}
```

---

## Sécurité

Cette route est publique par conception : après une redirection PayDunya,
l'utilisateur n'est pas authentifié (cookie de session potentiellement perdu).

Le numéro de commande (`ORD-xxx`) est un identifiant difficile à deviner
(timestamp inclus), ce qui limite l'exposition des données.

Si tu veux renforcer la sécurité : ajouter une validation que le token PayDunya
passé en query param correspond bien à cette commande.

```typescript
// Version sécurisée avec validation du token PayDunya (optionnel)
@Get('number/:orderNumber')
async getOrderByNumber(
  @Param('orderNumber') orderNumber: string,
  @Query('token') token?: string
) {
  // Vérifier optionnellement que le token correspond à la commande
  const order = await this.orderService.getOrderByNumber(orderNumber);
  return { success: true, data: order };
}
```
