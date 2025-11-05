# Guide d'Implémentation - Système de Commande Client pour Produits Vendeurs

## 📋 Vue d'Ensemble

Ce guide détaille l'implémentation d'un système de commande permettant à un **client** (authentifié ou invité) de commander un **produit vendeur** avec enregistrement complet des informations dans la base de données.

---

## 🎯 Objectifs

1. ✅ Permettre à un client de passer une commande pour un produit vendeur
2. ✅ Enregistrer toutes les informations client (nom, adresse, téléphone, etc.)
3. ✅ Gérer les articles commandés avec leurs variations (couleur, taille)
4. ✅ Intégrer le paiement PayTech ou Paiement à la livraison
5. ✅ Notifier le vendeur de la nouvelle commande
6. ✅ Gérer les statistiques de vente pour le vendeur

---

## 📊 Architecture Actuelle

### Modèles Prisma Impliqués

#### 1. **Order** (Commande)
```prisma
model Order {
  id                     Int                       @id @default(autoincrement())
  orderNumber            String                    @unique
  userId                 Int                       // ID du client
  status                 OrderStatus               @default(PENDING)
  totalAmount            Float
  phoneNumber            String
  notes                  String?

  // Adresse de livraison
  shippingName           String?
  shippingStreet         String?
  shippingCity           String?
  shippingRegion         String?
  shippingPostalCode     String?
  shippingCountry        String?
  shippingAddressFull    String?

  // Paiement
  paymentMethod          String?
  paymentStatus          String?                   // PENDING, PAID, FAILED
  transactionId          String?

  // Relations
  user                   User                      @relation(fields: [userId], references: [id])
  orderItems             OrderItem[]               // Articles commandés

  createdAt              DateTime                  @default(now())
  updatedAt              DateTime                  @updatedAt
}
```

#### 2. **OrderItem** (Article de commande)
```prisma
model OrderItem {
  id             Int             @id @default(autoincrement())
  orderId        Int
  productId      Int             // ID du produit (baseProductId)
  quantity       Int
  unitPrice      Float
  size           String?
  color          String?
  colorId        Int?

  order          Order           @relation(fields: [orderId], references: [id])
  product        Product         @relation(fields: [productId], references: [id])
  colorVariation ColorVariation? @relation(fields: [colorId], references: [id])
}
```

#### 3. **VendorProduct** (Produit Vendeur)
```prisma
model VendorProduct {
  id                       Int                     @id @default(autoincrement())
  baseProductId            Int                     // Lien vers Product (mockup admin)
  vendorId                 Int                     // ID du vendeur
  name                     String
  description              String?
  price                    Int
  stock                    Int                     @default(0)
  status                   VendorProductStatus     @default(PENDING)

  // Statistiques
  salesCount               Int                     @default(0)
  totalRevenue             Float                   @default(0)
  lastSaleDate             DateTime?

  vendor                   User                    @relation(fields: [vendorId], references: [id])
  baseProduct              Product                 @relation(fields: [baseProductId], references: [id])
}
```

---

## 🔧 Implémentation Step-by-Step

### Étape 1 : Endpoint de Création de Commande (✅ Déjà Implémenté)

Le système dispose déjà de deux endpoints :

#### A. **POST /orders/guest** - Pour clients invités
```typescript
// src/order/order.controller.ts
@Post('guest')
@HttpCode(HttpStatus.CREATED)
async createGuestOrder(@Body() createOrderDto: CreateOrderDto) {
  return {
    success: true,
    message: 'Commande invité créée avec succès',
    data: await this.orderService.createGuestOrder(createOrderDto)
  };
}
```

#### B. **POST /orders** - Pour clients authentifiés
```typescript
@Post()
@UseGuards(JwtAuthGuard)
@HttpCode(HttpStatus.CREATED)
async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
  return {
    success: true,
    message: 'Commande créée avec succès',
    data: await this.orderService.createOrder(req.user.sub, createOrderDto)
  };
}
```

---

### Étape 2 : Format de Requête (CreateOrderDto)

#### Structure de la requête JSON

```typescript
// src/order/dto/create-order.dto.ts
export class CreateOrderDto {
  // Informations de livraison
  shippingDetails: {
    shippingName: string;        // Nom complet du client
    shippingStreet: string;      // Adresse
    shippingCity: string;        // Ville
    shippingRegion: string;      // Région
    shippingPostalCode: string;  // Code postal
    shippingCountry: string;     // Pays
  };

  phoneNumber: string;           // Téléphone du client
  notes?: string;                // Notes optionnelles

  // Articles commandés
  orderItems: [
    {
      productId: number;         // ID du baseProduct (mockup admin)
      quantity: number;          // Quantité
      size?: string;             // Taille (ex: "M", "L", "XL")
      color?: string;            // Nom de couleur (ex: "Blanc")
      colorId?: number;          // ID de la variation de couleur
      unitPrice?: number;        // Prix unitaire (optionnel)
    }
  ];

  // Paiement
  paymentMethod?: 'PAYTECH' | 'CASH_ON_DELIVERY' | 'OTHER';
  initiatePayment?: boolean;   // true pour paiement immédiat via PayTech
}
```

#### Exemple de requête complète

```json
{
  "shippingDetails": {
    "shippingName": "Fatou Diop",
    "shippingStreet": "123 Avenue Cheikh Anta Diop",
    "shippingCity": "Dakar",
    "shippingRegion": "Dakar",
    "shippingPostalCode": "12500",
    "shippingCountry": "Sénégal"
  },
  "phoneNumber": "+221771234567",
  "notes": "Livraison entre 14h et 18h",
  "orderItems": [
    {
      "productId": 15,
      "quantity": 2,
      "size": "L",
      "color": "Blanc",
      "colorId": 3,
      "unitPrice": 15000
    }
  ],
  "paymentMethod": "PAYTECH",
  "initiatePayment": true
}
```

---

### Étape 3 : Lien entre VendorProduct et Order

#### Problème
Actuellement, `orderItems` référence `productId` (qui est le `baseProductId` du mockup admin), mais pas directement le `VendorProduct`.

#### Solution : Identifier le VendorProduct

**Option 1 : Ajouter vendorProductId dans OrderItem**

Modifier le schéma Prisma :

```prisma
model OrderItem {
  id                Int             @id @default(autoincrement())
  orderId           Int
  productId         Int             // baseProductId (mockup admin)
  vendorProductId   Int?            // 🆕 ID du produit vendeur
  quantity          Int
  unitPrice         Float
  size              String?
  color             String?
  colorId           Int?

  order             Order           @relation(fields: [orderId], references: [id])
  product           Product         @relation(fields: [productId], references: [id])
  vendorProduct     VendorProduct?  @relation(fields: [vendorProductId], references: [id]) // 🆕
  colorVariation    ColorVariation? @relation(fields: [colorId], references: [id])

  @@index([vendorProductId]) // 🆕
}
```

**Option 2 : Rechercher via baseProductId + vendorId**

Si vous ne voulez pas modifier le schéma, vous pouvez identifier le VendorProduct dans le service :

```typescript
// Dans order.service.ts
async createOrder(userId: number, createOrderDto: CreateOrderDto) {
  // Pour chaque orderItem, trouver le VendorProduct correspondant
  for (const item of createOrderDto.orderItems) {
    const vendorProduct = await this.prisma.vendorProduct.findFirst({
      where: {
        baseProductId: item.productId,
        status: 'APPROVED',  // Seulement les produits approuvés
        isDelete: false
      },
      include: { vendor: true }
    });

    if (vendorProduct) {
      console.log(`Produit vendeur trouvé: ${vendorProduct.name} par ${vendorProduct.vendor.shop_name}`);
    }
  }

  // ... suite de la création de commande
}
```

---

### Étape 4 : Mise à Jour des Statistiques Vendeur (✅ Déjà Implémenté)

Le système utilise déjà `SalesStatsUpdaterService` pour mettre à jour automatiquement :

```typescript
// src/vendor-product/services/sales-stats-updater.service.ts

// ✅ Lors de la création de commande
await this.salesStatsUpdaterService.updateStatsOnOrderCreation(order.id);

// ✅ Lors de la livraison
await this.salesStatsUpdaterService.updateSalesStatsOnDelivery(order.id);
```

---

### Étape 5 : Notification du Vendeur

#### A. Créer un service de notification

```typescript
// src/order/order.service.ts

async createOrder(userId: number, createOrderDto: CreateOrderDto) {
  // ... création de la commande ...

  const order = await this.prisma.order.create({
    // ... données ...
  });

  // 🆕 Notifier les vendeurs concernés
  await this.notifyVendorsOfNewOrder(order.id);

  return order;
}

private async notifyVendorsOfNewOrder(orderId: number) {
  try {
    // Récupérer la commande avec tous les items
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        user: true
      }
    });

    if (!order) return;

    // Identifier tous les vendeurs concernés
    const vendorIds = new Set<number>();

    for (const item of order.orderItems) {
      // Trouver le VendorProduct correspondant
      const vendorProducts = await this.prisma.vendorProduct.findMany({
        where: {
          baseProductId: item.productId,
          status: 'APPROVED',
          isDelete: false
        },
        select: { vendorId: true }
      });

      vendorProducts.forEach(vp => vendorIds.add(vp.vendorId));
    }

    // Créer des notifications pour chaque vendeur
    for (const vendorId of vendorIds) {
      await this.prisma.notification.create({
        data: {
          userId: vendorId,
          type: 'NEW_ORDER',
          title: '🛍️ Nouvelle commande reçue !',
          message: `Une nouvelle commande (${order.orderNumber}) contenant vos produits a été passée.`,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            customerName: order.shippingName || order.user.firstName
          }
        }
      });

      this.logger.log(`✅ Notification envoyée au vendeur ${vendorId} pour commande ${order.orderNumber}`);
    }

    // 🆕 Envoyer notification en temps réel via WebSocket
    for (const vendorId of vendorIds) {
      this.orderGateway.notifyNewOrder(vendorId, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        customerName: order.shippingName
      });
    }

  } catch (error) {
    this.logger.error(`❌ Erreur notification vendeurs pour commande ${orderId}:`, error);
    // Ne pas faire échouer la création de commande
  }
}
```

#### B. Endpoint pour récupérer les commandes vendeur (✅ Déjà Implémenté)

```typescript
// src/order/order.controller.ts

@Get('my-orders')
@UseGuards(JwtAuthGuard)
async getUserOrders(@Request() req) {
  // Si l'utilisateur est un VENDEUR
  if (req.user.role === 'VENDEUR') {
    return {
      success: true,
      message: 'Vos commandes récupérées avec succès',
      data: await this.orderService.getVendorOrders(req.user.sub)
    };
  }

  // Sinon, commandes client normales
  return {
    success: true,
    message: 'Vos commandes récupérées avec succès',
    data: await this.orderService.getUserOrders(req.user.sub)
  };
}
```

---

## 🚀 Scénario d'Utilisation Complet

### Scénario 1 : Client Invité Commande un Produit Vendeur

#### 1. **Client visite le site**
```
GET /products?forVendorDesign=true
→ Récupère la liste des mockups disponibles pour les vendeurs
```

#### 2. **Client sélectionne un produit d'un vendeur**
```
GET /vendor-products?baseProductId=15
→ Récupère tous les produits vendeurs basés sur ce mockup
```

Réponse :
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "vendorId": 12,
      "baseProductId": 15,
      "name": "T-shirt Teranga Design",
      "price": 15000,
      "stock": 50,
      "vendor": {
        "id": 12,
        "shop_name": "Teranga Designs",
        "firstName": "Amadou",
        "lastName": "Ba"
      }
    }
  ]
}
```

#### 3. **Client passe commande**
```http
POST /orders/guest
Content-Type: application/json

{
  "shippingDetails": {
    "shippingName": "Fatou Diop",
    "shippingStreet": "123 Avenue Cheikh Anta Diop",
    "shippingCity": "Dakar",
    "shippingRegion": "Dakar",
    "shippingPostalCode": "12500",
    "shippingCountry": "Sénégal"
  },
  "phoneNumber": "+221771234567",
  "notes": "Livraison entre 14h et 18h",
  "orderItems": [
    {
      "productId": 15,
      "quantity": 2,
      "size": "L",
      "color": "Blanc",
      "colorId": 3,
      "unitPrice": 15000
    }
  ],
  "paymentMethod": "PAYTECH",
  "initiatePayment": true
}
```

#### 4. **Système traite la commande**
```typescript
// order.service.ts

async createGuestOrder(createOrderDto: CreateOrderDto) {
  // 1. Créer la commande avec userId: 3 (compte invité)
  const order = await this.prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}`,
      userId: 3,  // Compte invité par défaut
      totalAmount: 30000,  // 2 × 15000 FCFA
      status: 'PENDING',
      // ... autres champs ...
    }
  });

  // 2. Mettre à jour les statistiques du vendeur
  await this.salesStatsUpdaterService.updateStatsOnOrderCreation(order.id);

  // 3. Notifier le vendeur
  await this.notifyVendorsOfNewOrder(order.id);

  // 4. Initier le paiement PayTech
  const paymentResponse = await this.paytechService.requestPayment({
    item_name: `Order ${order.orderNumber}`,
    item_price: order.totalAmount,
    ref_command: order.orderNumber,
    // ...
  });

  return {
    ...order,
    payment: {
      token: paymentResponse.token,
      redirect_url: paymentResponse.redirect_url
    }
  };
}
```

#### 5. **Vendeur reçoit notification**
```json
{
  "type": "NEW_ORDER",
  "title": "🛍️ Nouvelle commande reçue !",
  "message": "Une nouvelle commande (ORD-1234567890) contenant vos produits a été passée.",
  "metadata": {
    "orderId": 123,
    "orderNumber": "ORD-1234567890",
    "totalAmount": 30000,
    "customerName": "Fatou Diop"
  }
}
```

#### 6. **Vendeur consulte ses commandes**
```http
GET /orders/my-orders
Authorization: Bearer <vendor_jwt_token>
```

Réponse :
```json
{
  "success": true,
  "message": "Vos commandes récupérées avec succès",
  "data": [
    {
      "id": 123,
      "orderNumber": "ORD-1234567890",
      "status": "PENDING",
      "totalAmount": 30000,
      "shippingName": "Fatou Diop",
      "phoneNumber": "+221771234567",
      "orderItems": [
        {
          "productId": 15,
          "quantity": 2,
          "size": "L",
          "color": "Blanc",
          "unitPrice": 15000,
          "product": {
            "id": 15,
            "name": "T-shirt Basic Mockup"
          }
        }
      ],
      "createdAt": "2025-01-15T10:30:00Z",
      "vendor": {
        "id": 12,
        "shopName": "Teranga Designs"
      }
    }
  ]
}
```

---

## 📝 Migration Prisma Nécessaire

Si vous choisissez **Option 1** (ajouter `vendorProductId` dans `OrderItem`) :

```bash
npx prisma migrate dev --name add_vendor_product_to_order_item
```

Fichier de migration :
```sql
-- Add vendorProductId to OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "vendorProductId" INTEGER;

-- Add foreign key constraint
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_vendorProductId_fkey"
  FOREIGN KEY ("vendorProductId")
  REFERENCES "VendorProduct"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Add index for performance
CREATE INDEX "OrderItem_vendorProductId_idx" ON "OrderItem"("vendorProductId");
```

---

## ✅ Checklist d'Implémentation

### Backend

- [x] **Endpoints de commande existants**
  - [x] `POST /orders/guest` - Commande invité
  - [x] `POST /orders` - Commande authentifiée
  - [x] `GET /orders/my-orders` - Récupération commandes

- [ ] **Améliorations nécessaires**
  - [ ] Ajouter `vendorProductId` dans `OrderItem` (Option 1)
  - [ ] OU Implémenter recherche dynamique VendorProduct (Option 2)
  - [ ] Créer méthode `notifyVendorsOfNewOrder()`
  - [ ] Ajouter notification en temps réel via WebSocket
  - [ ] Tester intégration PayTech

- [x] **Statistiques vendeur**
  - [x] Mise à jour automatique lors de création commande
  - [x] Mise à jour automatique lors de livraison
  - [x] Tracking `salesCount`, `totalRevenue`, `lastSaleDate`

### Frontend

- [ ] **Page de commande**
  - [ ] Formulaire d'informations client
  - [ ] Sélection adresse de livraison
  - [ ] Récapitulatif du panier
  - [ ] Choix méthode de paiement
  - [ ] Intégration PayTech

- [ ] **Dashboard vendeur**
  - [ ] Liste des commandes reçues
  - [ ] Notifications en temps réel
  - [ ] Détails de chaque commande
  - [ ] Statistiques de ventes

---

## 🔍 Tests à Effectuer

### 1. **Test de commande invité**
```bash
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "shippingDetails": {
      "shippingName": "Test User",
      "shippingStreet": "123 Test St",
      "shippingCity": "Dakar",
      "shippingRegion": "Dakar",
      "shippingPostalCode": "12500",
      "shippingCountry": "Sénégal"
    },
    "phoneNumber": "+221771234567",
    "orderItems": [
      {
        "productId": 1,
        "quantity": 1,
        "size": "M",
        "color": "Blanc",
        "colorId": 1
      }
    ],
    "paymentMethod": "CASH_ON_DELIVERY"
  }'
```

### 2. **Test de récupération commandes vendeur**
```bash
curl -X GET http://localhost:3004/orders/my-orders \
  -H "Authorization: Bearer <vendor_jwt_token>"
```

### 3. **Test de paiement PayTech**
```bash
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "shippingDetails": { /* ... */ },
    "orderItems": [ /* ... */ ],
    "paymentMethod": "PAYTECH",
    "initiatePayment": true
  }'
```

---

## 📚 Ressources

### Fichiers Importants

- `src/order/order.service.ts` - Logique métier des commandes
- `src/order/order.controller.ts` - Endpoints API
- `src/order/dto/create-order.dto.ts` - Validation des données
- `src/vendor-product/services/sales-stats-updater.service.ts` - Statistiques
- `prisma/schema.prisma` - Schéma de base de données

### Documentation PayTech

- [Documentation PayTech API](https://paytech.sn/documentation)
- Configuration dans `.env`:
  ```env
  PAYTECH_API_KEY=your_api_key
  PAYTECH_API_SECRET=your_api_secret
  PAYTECH_ENVIRONMENT=test
  PAYTECH_IPN_URL=http://localhost:3004/paytech/ipn
  PAYTECH_SUCCESS_URL=http://localhost:5174/payment/success
  PAYTECH_CANCEL_URL=http://localhost:5174/payment/cancel
  ```

---

## 🎉 Conclusion

Ce guide fournit une feuille de route complète pour implémenter le système de commande client pour les produits vendeurs. Le système backend est déjà bien structuré avec :

✅ Endpoints de création de commande
✅ Gestion des informations client
✅ Intégration paiement PayTech
✅ Statistiques vendeur automatiques

**Prochaines étapes** :
1. Décider entre Option 1 ou Option 2 pour lier VendorProduct
2. Implémenter les notifications vendeur
3. Tester le flux complet de commande
4. Développer l'interface frontend

Bon développement ! 🚀
