# 🗄️ STOCKAGE DES TRANSACTIONS PAYTECH EN BASE DE DONNÉES

## 📋 STRUCTURE PRINCIPALE

### 🏪 **Table principale : `orders`**

Les transactions Paytech sont enregistrées dans la table **`orders`** avec les champs suivants :

| Champ | Type | Description | Valeur Paytech |
|-------|------|-------------|----------------|
| `id` | Int | ID unique de la commande | Auto-généré |
| `orderNumber` | String | Référence unique client | **ref_command** |
| `status` | OrderStatus | Statut de la commande | PENDING → CONFIRMED |
| `paymentStatus` | String | **Statut du paiement Paytech** | **PENDING, PAID, FAILED** |
| `transactionId` | String | **ID transaction Paytech** | **token_payment** |
| `totalAmount` | Float | Montant total | item_price |
| `paymentMethod` | String | Méthode de paiement | "PAYTECH" |
| `phoneNumber` | String | Téléphone client | Optionnel |
| `createdAt` | DateTime | Date de création | Auto |
| `updatedAt` | DateTime | Dernière modification | Auto |

### 📦 **Table secondaire : `order_items`**

| Champ | Type | Description |
|-------|------|-------------|
| `orderId` | Int | Lien vers la commande (`orders.id`) |
| `productId` | Int | ID du produit |
| `quantity` | Int | Quantité |
| `unitPrice` | Float | Prix unitaire |
| `size` | String | Taille (optionnel) |
| `color` | String | Couleur (optionnel) |

## 🔄 **FLUX DE DONNÉES PAYTECH**

### 1. **Initialisation du paiement**
```sql
INSERT INTO orders (
  orderNumber,    -- "TEST-001" (ref_command)
  status,         -- "PENDING"
  paymentStatus,  -- "PENDING"
  totalAmount,    -- 1000.00 (item_price)
  paymentMethod,  -- "PAYTECH"
  transactionId,  -- NULL (pas encore)
  userId,         -- ID utilisateur
  phoneNumber,    -- Numéro client
  createdAt,      -- NOW()
  updatedAt       -- NOW()
);
```

### 2. **IPN Callback - Paiement réussi**
```sql
UPDATE orders SET
  paymentStatus = 'PAID',           -- Succès Paytech
  transactionId = '405gzwpmh97...', -- Token Paytech
  status = 'CONFIRMED',             -- Commande confirmée
  updatedAt = NOW()
WHERE orderNumber = 'TEST-001';
```

### 3. **IPN Callback - Paiement échoué**
```sql
UPDATE orders SET
  paymentStatus = 'FAILED',         -- Échec Paytech
  transactionId = '405gzwpmh97...', -- Token Paytech
  status = 'CANCELLED',             -- Commande annulée
  updatedAt = NOW()
WHERE orderNumber = 'TEST-001';
```

## 🎯 **STATUTS POSSIBLES**

### **OrderStatus** (statut commande)
- `PENDING` - En attente de paiement
- `CONFIRMED` - Paiement accepté
- `PROCESSING` - En préparation
- `SHIPPED` - Expédié
- `DELIVERED` - Livré
- `CANCELLED` - Annulé
- `REJECTED` - Rejeté

### **PaymentStatus** (statut paiement Paytech)
- `PENDING` - En attente (défaut)
- `PAID` - Payé avec succès
- `FAILED` - Paiement échoué

## 🔍 **REQUÊTES UTILES**

### **1. Voir toutes les transactions Paytech**
```sql
SELECT
  orderNumber,
  totalAmount,
  paymentStatus,
  transactionId,
  status,
  createdAt
FROM orders
WHERE paymentMethod = 'PAYTECH'
ORDER BY createdAt DESC;
```

### **2. Voir les transactions Paytech en attente**
```sql
SELECT
  orderNumber,
  totalAmount,
  paymentStatus,
  transactionId,
  createdAt
FROM orders
WHERE paymentMethod = 'PAYTECH'
  AND paymentStatus = 'PENDING'
ORDER BY createdAt DESC;
```

### **3. Voir les transactions Paytech payées**
```sql
SELECT
  orderNumber,
  totalAmount,
  transactionId,
  createdAt,
  updatedAt
FROM orders
WHERE paymentMethod = 'PAYTECH'
  AND paymentStatus = 'PAID'
ORDER BY updatedAt DESC;
```

### **4. Statistiques des transactions**
```sql
SELECT
  paymentStatus,
  COUNT(*) as nombre,
  SUM(totalAmount) as total_montant
FROM orders
WHERE paymentMethod = 'PAYTECH'
GROUP BY paymentStatus;
```

## 📊 **VOS TRANSACTIONS ACTUELLES**

**Test 1 - Simple (1000 XOF)**
- **orderNumber**: `SIMPLE-1732678591`
- **paymentStatus**: `PENDING`
- **transactionId**: `eey3kpmh97ru31`
- **totalAmount**: `1000.00`
- **paymentMethod**: `PAYTECH`

**Test 2 - Moyen (2500 XOF)**
- **orderNumber**: `MOYEN-1732678591`
- **paymentStatus**: `PENDING`
- **transactionId**: `405gzppmh97ruam`
- **totalAmount**: `2500.00`
- **paymentMethod**: `PAYTECH`

**Test 3 - Gros (10000 XOF)**
- **orderNumber**: `GROS-1732678591`
- **paymentStatus**: `PENDING`
- **transactionId**: `405gzopmh97rujm`
- **totalAmount**: `10000.00`
- **paymentMethod**: `PAYTECH`

## 🚨 **POURQUOI VOUS NE VOYEZ RIEN ?**

### **1. Pas de création de commande**
- Les transactions Paytech sont créées mais **sans commande associée**
- Il faut créer une commande avant le paiement

### **2. Pas d'IPN Callback**
- Les paiements ne sont pas finalisés
- `paymentStatus` reste à `PENDING`
- `transactionId` reste `NULL`

### **3. Pas de userId valide**
- Toutes les commandes nécessitent un `userId`
- Les transactions test n'ont pas d'utilisateur associé

## 💡 **SOLUTION**

Pour voir les transactions dans la base de données :

1. **Créez une commande complète** avec userId
2. **Finalisez un paiement** via les URLs
3. **Vérifiez l'IPN callback** pour mise à jour

## 🎛️ **INDEX DE PERFORMANCE**

```sql
-- Index pour la recherche rapide
CREATE INDEX idx_orders_payment_method ON orders(paymentMethod);
CREATE INDEX idx_orders_payment_status ON orders(paymentStatus);
CREATE INDEX idx_orders_transaction_id ON orders(transactionId);
CREATE INDEX idx_orders_order_number ON orders(orderNumber);
```

---

**🎯 Conclusion :** Les transactions Paytech sont stockées dans la table **`orders`** avec des champs spécifiques pour le suivi des paiements.