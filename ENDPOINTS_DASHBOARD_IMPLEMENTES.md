# Guide Backend - Système de Gestion des Commandes Vendeur

Ce guide détaille l'implémentation backend nécessaire pour le système de gestion des commandes vendeur dans PrintAlma.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure de données](#structure-de-données)
3. [Endpoints API requis](#endpoints-api-requis)
4. [Modèles de données](#modèles-de-données)
5. [Permissions et sécurité](#permissions-et-sécurité)
6. [Notifications en temps réel](#notifications-en-temps-réel)
7. [Tests et validation](#tests-et-validation)

## 🎯 Vue d'ensemble

Le système de gestion des commandes vendeur permet aux vendeurs de :
- Visualiser leurs commandes avec filtres et recherche
- Consulter les détails complets d'une commande
- Mettre à jour le statut des commandes (selon permissions)
- Recevoir des statistiques de vente
- Exporter des données

### URL de base
```
https://printalma-back-dep.onrender.com
```

## 🗄️ Structure de données

### Statuts de commande
```typescript
enum OrderStatus {
  PENDING = 'PENDING',           // En attente
  CONFIRMED = 'CONFIRMED',       // Confirmée
  PROCESSING = 'PROCESSING',     // En traitement
  SHIPPED = 'SHIPPED',          // Expédiée
  DELIVERED = 'DELIVERED',      // Livrée
  CANCELLED = 'CANCELLED',      // Annulée
  REJECTED = 'REJECTED'         // Rejetée
}
```

### Permissions vendeur
Les vendeurs peuvent uniquement modifier les statuts suivants :
- `PENDING` → `CONFIRMED`
- `CONFIRMED` → `PROCESSING`
- `PROCESSING` → `SHIPPED`

## 🔗 Endpoints API requis

### 1. Récupérer les commandes du vendeur

```http
GET /vendor/orders
```

**Headers requis :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters :**
```typescript
interface VendorOrderFilters {
  page?: number;          // Page (défaut: 1)
  limit?: number;         // Limite par page (défaut: 10)
  status?: OrderStatus;   // Filtre par statut
  search?: string;        // Recherche par numéro/client/email
  startDate?: string;     // Date début (ISO string)
  endDate?: string;       // Date fin (ISO string)
  minAmount?: number;     // Montant minimum
  maxAmount?: number;     // Montant maximum
  sortBy?: string;        // Champ de tri (défaut: 'createdAt')
  sortOrder?: 'asc' | 'desc'; // Ordre de tri (défaut: 'desc')
}
```

**Exemples d'appels :**
```bash
# Toutes les commandes paginées
GET /vendor/orders?page=1&limit=10

# Commandes en traitement
GET /vendor/orders?status=PROCESSING

# Recherche par client
GET /vendor/orders?search=marie.durand@email.com

# Période spécifique
GET /vendor/orders?startDate=2024-01-01&endDate=2024-01-31

# Tri par montant décroissant
GET /vendor/orders?sortBy=totalAmount&sortOrder=desc
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Commandes récupérées avec succès",
  "data": {
    "orders": [
      {
        "id": 1,
        "orderNumber": "CMD-2024-001",
        "userId": 101,
        "user": {
          "id": 101,
          "firstName": "Marie",
          "lastName": "Durand",
          "email": "marie.durand@email.com",
          "role": "CLIENT",
          "photo_profil": "https://cloudinary.com/profile.jpg"
        },
        "status": "PROCESSING",
        "totalAmount": 35000,
        "subtotal": 31500,
        "taxAmount": 0,
        "shippingAmount": 3500,
        "paymentMethod": "MOBILE_MONEY",
        "shippingAddress": {
          "name": "Marie Durand",
          "firstName": "Marie",
          "lastName": "Durand",
          "street": "123 Rue de la Paix",
          "city": "Dakar",
          "region": "Dakar",
          "country": "Sénégal",
          "fullFormatted": "123 Rue de la Paix, Dakar, Sénégal",
          "phone": "+221 77 123 45 67"
        },
        "phoneNumber": "+221 77 123 45 67",
        "notes": "Livraison urgente s'il vous plaît",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T14:20:00Z",
        "confirmedAt": "2024-01-15T11:00:00Z",
        "shippedAt": null,
        "deliveredAt": null,
        "orderItems": [
          {
            "id": 1,
            "quantity": 2,
            "unitPrice": 17500,
            "totalPrice": 35000,
            "size": "M",
            "color": "Noir",
            "colorId": 5,
            "productId": 1,
            "productName": "T-shirt Design Afrique",
            "productImage": "https://cloudinary.com/product1.jpg",
            "product": {
              "id": 1,
              "name": "T-shirt Design Afrique",
              "description": "T-shirt avec design africain authentique",
              "price": 17500,
              "designName": "Motif Wax Traditionnel",
              "designDescription": "Design inspiré des motifs wax traditionnels",
              "designImageUrl": "https://cloudinary.com/design1.jpg",
              "categoryId": 1,
              "categoryName": "Vêtements"
            }
          }
        ]
      }
    ],
    "total": 25,
    "page": 1,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### 2. Détails d'une commande spécifique

```http
GET /vendor/orders/:orderId
```

**Headers requis :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Réponse :** Même structure qu'une commande individuelle ci-dessus.

**Codes d'erreur :**
- `404` : Commande non trouvée ou pas d'accès
- `403` : Accès non autorisé

### 3. Mettre à jour le statut d'une commande

```http
PATCH /vendor/orders/:orderId/status
```

**Headers requis :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**
```json
{
  "status": "PROCESSING",
  "notes": "Commande préparée et prête à expédier"
}
```

**Validations côté backend :**
1. Vérifier que le vendeur est propriétaire de produits dans cette commande
2. Vérifier que la transition de statut est autorisée
3. Mettre à jour les timestamps appropriés (`confirmedAt`, `shippedAt`, etc.)

**Réponse :**
```json
{
  "success": true,
  "message": "Statut de commande mis à jour",
  "data": {
    // Commande complète mise à jour
  }
}
```

### 4. Statistiques vendeur

```http
GET /vendor/orders/statistics
```

**Headers requis :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Réponse :**
```json
{
  "success": true,
  "message": "Statistiques récupérées",
  "data": {
    "totalOrders": 25,
    "totalRevenue": 875000,
    "averageOrderValue": 35000,
    "monthlyGrowth": 15.2,
    "pendingOrders": 3,
    "processingOrders": 5,
    "shippedOrders": 8,
    "deliveredOrders": 7,
    "cancelledOrders": 2,
    "revenueThisMonth": 245000,
    "ordersThisMonth": 8,
    "revenueLastMonth": 210000,
    "ordersLastMonth": 6
  }
}
```

### 5. Recherche de commandes

```http
GET /vendor/orders/search?q=:query
```

**Headers requis :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Paramètres :**
- `q` : Terme de recherche (numéro commande, nom client, email)

### 6. Commandes par statut

```http
GET /vendor/orders/status/:status
```

**Headers requis :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

### 7. Export CSV

```http
GET /vendor/orders/export/csv
```

**Headers requis :**
```
Authorization: Bearer <token>
Accept: text/csv
```

**Query Parameters :**
```
status?: OrderStatus
startDate?: string
endDate?: string
```

**Réponse :** Fichier CSV avec headers :
```csv
Numéro,Client,Email,Statut,Montant,Date Création,Date Livraison
CMD-2024-001,Marie Durand,marie.durand@email.com,PROCESSING,35000,2024-01-15,
```

### 8. Notifications vendeur

```http
GET /vendor/orders/notifications
```

**Headers requis :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "NEW_ORDER",
      "title": "Nouvelle commande",
      "message": "Vous avez reçu une nouvelle commande #CMD-2024-001",
      "orderId": 1,
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 9. Marquer notification comme lue

```http
PATCH /vendor/orders/notifications/:notificationId/read
```

## 🗃️ Modèles de données

### Modèle Order (base de données)

```sql
-- Table orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  total_amount DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2),
  tax_amount DECIMAL(12,2) DEFAULT 0,
  shipping_amount DECIMAL(12,2) DEFAULT 0,
  payment_method VARCHAR(50),
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  phone_number VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP NULL,
  shipped_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  validated_at TIMESTAMP NULL,
  validated_by INTEGER REFERENCES users(id)
);

-- Table order_items
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  size VARCHAR(10),
  color VARCHAR(50),
  color_id INTEGER REFERENCES product_colors(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les requêtes vendeur
CREATE INDEX idx_orders_vendor_products ON order_items(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

### Relations importantes

Pour identifier les commandes d'un vendeur :
```sql
-- Commandes contenant les produits du vendeur connecté
SELECT DISTINCT o.*
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE p.vendor_id = :vendorId
```

## 🔐 Permissions et sécurité

### Middleware d'authentification vendeur

```javascript
// Exemple de middleware Express.js
const requireVendorAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'VENDEUR') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux vendeurs'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};
```

### Vérification des permissions

```javascript
// Vérifier que le vendeur a accès à cette commande
const checkOrderAccess = async (vendorId, orderId) => {
  const order = await Order.findOne({
    where: { id: orderId },
    include: [{
      model: OrderItem,
      include: [{
        model: Product,
        where: { vendor_id: vendorId }
      }]
    }]
  });

  return order && order.OrderItems.length > 0;
};
```

### Validation des transitions de statut

```javascript
const VENDOR_ALLOWED_TRANSITIONS = {
  'PENDING': ['CONFIRMED'],
  'CONFIRMED': ['PROCESSING'],
  'PROCESSING': ['SHIPPED'],
  'SHIPPED': [],
  'DELIVERED': [],
  'CANCELLED': [],
  'REJECTED': []
};

const canVendorUpdateStatus = (currentStatus, newStatus) => {
  return VENDOR_ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};
```

## 🔔 Notifications en temps réel

### WebSocket events pour vendeurs

```javascript
// Événements à émettre côté backend
const notifyVendor = (vendorId, event, data) => {
  io.to(`vendor_${vendorId}`).emit(event, data);
};

// Types d'événements
const VENDOR_EVENTS = {
  NEW_ORDER: 'vendor:new_order',
  ORDER_STATUS_CHANGED: 'vendor:order_status_changed',
  ORDER_CANCELLED: 'vendor:order_cancelled'
};

// Exemple d'utilisation
// Quand une nouvelle commande est créée avec des produits du vendeur
notifyVendor(vendorId, VENDOR_EVENTS.NEW_ORDER, {
  orderId: order.id,
  orderNumber: order.orderNumber,
  customerName: `${order.user.firstName} ${order.user.lastName}`,
  totalAmount: order.totalAmount,
  message: `Nouvelle commande ${order.orderNumber} reçue`
});
```

## 🧪 Tests et validation

### Tests essentiels à implémenter

1. **Tests d'endpoints**
```javascript
describe('Vendor Orders API', () => {
  test('GET /vendor/orders - should return vendor orders only', async () => {
    // Test avec authentification vendeur
    // Vérifier que seules les commandes avec produits du vendeur sont retournées
  });

  test('PATCH /vendor/orders/:id/status - should update status with valid transition', async () => {
    // Test mise à jour statut autorisée
  });

  test('PATCH /vendor/orders/:id/status - should reject invalid transition', async () => {
    // Test transition non autorisée
  });
});
```

2. **Tests de permissions**
```javascript
test('should deny access to orders without vendor products', async () => {
  // Vendeur A ne doit pas voir les commandes du vendeur B
});
```

### Données de test

```sql
-- Script d'initialisation avec données de test
INSERT INTO users (first_name, last_name, email, role) VALUES
('Marie', 'Durand', 'marie.durand@email.com', 'CLIENT'),
('Jean', 'Martin', 'jean.martin@email.com', 'VENDEUR');

INSERT INTO products (name, price, vendor_id) VALUES
('T-shirt Design Afrique', 17500, 2),
('Hoodie Premium', 28000, 2);

INSERT INTO orders (order_number, user_id, total_amount, phone_number, shipping_address) VALUES
('CMD-2024-001', 1, 35000, '+221771234567', '{"name":"Marie Durand","street":"123 Rue de la Paix","city":"Dakar","country":"Sénégal"}');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 2, 17500);
```

## 🚀 Déploiement et monitoring

### Variables d'environnement requises

```env
# Base de données
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# WebSocket
WEBSOCKET_PORT=3005

# Email notifications (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@printalma.com
SMTP_PASS=password
```

### Métriques à monitorer

1. **Performance**
   - Temps de réponse des endpoints
   - Nombre de requêtes par minute
   - Utilisation mémoire/CPU

2. **Business**
   - Nombre de commandes créées/heure
   - Taux de conversion par statut
   - Revenus par vendeur

3. **Erreurs**
   - Taux d'erreur 4xx/5xx
   - Échecs d'authentification
   - Tentatives d'accès non autorisé

## 📝 Notes d'implémentation

### Optimisations recommandées

1. **Cache Redis** pour les statistiques fréquemment consultées
2. **Pagination** obligatoire sur tous les endpoints de liste
3. **Rate limiting** pour éviter l'abus des APIs
4. **Logs structurés** pour le debugging

### Compatibilité frontend

Le frontend attend des réponses au format :
```json
{
  "success": boolean,
  "message": string,
  "data": any,
  "statusCode"?: number
}
```

Assurez-vous que tous vos endpoints respectent cette structure.

---

Ce guide fournit toutes les spécifications nécessaires pour implémenter le backend du système de gestion des commandes vendeur. L'implémentation doit respecter ces specifications pour assurer la compatibilité avec le frontend existant.