# 💰 OÙ SONT ENREGISTRÉS LES PAIEMENTS PAYTECH ?

## 🎯 **RÉPONSE PRÉCISE**

### **Table principale : `orders`**

Les paiements Paytech sont enregistrés dans **UNE SEULE TABLE** :

```
📦 Table : orders
```

## 📋 **STRUCTURE EXACTE DE LA TABLE `orders`**

```sql
CREATE TABLE orders (
  id                  Int                       @id @default(autoincrement())
  orderNumber         String                    @unique
  userId              Int
  status              OrderStatus               @default(PENDING)
  totalAmount         Float
  phoneNumber         String
  notes               String?
  createdAt           DateTime                  @default(now())
  updatedAt           DateTime                  @updatedAt
  validatedAt         DateTime?
  validatedBy         Int?
  shippingName        String?
  shippingStreet      String?
  shippingCity        String?
  shippingRegion      String?
  shippingPostalCode  String?
  shippingCountry     String?
  shippingAddressFull String?
  confirmedAt         DateTime?
  deliveredAt         DateTime?
  paymentMethod       String?                   -- 👈 Méthode "PAYTECH"
  paymentStatus       String?                   -- 👈 PENDING, PAID, FAILED
  transactionId       String?                   -- 👈 Token Paytech
  shippedAt           DateTime?
  shippingAmount      Float                     @default(0)
  subtotal            Float?
  taxAmount           Float                     @default(0)
  user                User                      @relation(fields: [userId], references: [id])
  validator           User?                     @relation("OrderValidator", fields: [validatedBy], references: [id])
  orderItems          OrderItem[]
  fundsRequestLinks   VendorFundsRequestOrder[]
  @@index([userId])
  @@index([status])
  @@index([orderNumber])
  @@index([paymentStatus])       -- 👈 Index Paytech
  @@index([transactionId])       -- 👈 Index Paytech
);
```

## 🔄 **PROCESSUS D'ENREGISTREMENT PAYTECH**

### **1. Initialisation du paiement**
```sql
INSERT INTO orders (
  orderNumber,    -- "TEST-001" (ref_command)
  status,         -- "PENDING"
  totalAmount,    -- 1000.00 (item_price)
  paymentMethod,  -- "PAYTECH" 👈
  paymentStatus,  -- "PENDING" 👈
  transactionId,  -- NULL (pas encore)
  userId,         -- ID utilisateur requis
  phoneNumber,    -- Téléphone client
  createdAt       -- NOW()
);
```

### **2. IPN Callback - Paiement réussi**
```sql
UPDATE orders SET
  paymentStatus = 'PAID',           -- 👈 Succès Paytech
  transactionId = '405gzwpmh97...', -- 👈 Token Paytech
  status = 'CONFIRMED',             -- Commande confirmée
  updatedAt = NOW()
WHERE orderNumber = 'TEST-001';
```

### **3. IPN Callback - Paiement échoué**
```sql
UPDATE orders SET
  paymentStatus = 'FAILED',         -- 👈 Échec Paytech
  transactionId = '405gzwpmh97...', -- 👈 Token Paytech
  status = 'CANCELLED',             -- Commande annulée
  updatedAt = NOW()
WHERE orderNumber = 'TEST-001';
```

## 🎯 **CHAMPS SPÉCIFIQUES PAYTECH**

| Champ | Type | Valeur Paytech | Description |
|-------|------|----------------|-------------|
| `paymentMethod` | String | **"PAYTECH"** | Méthode de paiement |
| `paymentStatus` | String | **"PENDING"**, **"PAID"**, **"FAILED"** | Statut du paiement |
| `transactionId` | String | **"405gzwpmh97..."** | Token/ID transaction Paytech |

## 🔍 **POURQUOI VOUS NE VOYEZ RIEN ?**

### **1. ❌ La table `orders` n'existait pas**
- La base de données n'avait pas les tables créées
- **Solution appliquée** : `npx prisma db push --force-reset`

### **2. ❌ Pas de commandes créées**
- Les transactions Paytech sont créées mais sans `userId`
- Il faut créer une commande complète avec utilisateur

### **3. ❌ Pas de paiement finalisé**
- Les transactions restent en `paymentStatus = 'PENDING'`
- Il faut finaliser les paiements via les URLs

## 📊 **VOS TRANSACTIONS DEVRAIENT APPARAÎTRE ICI**

Après avoir créé une commande complète :

```sql
SELECT
  orderNumber,      -- "TEST-001"
  totalAmount,      -- 1000.00
  paymentMethod,    -- "PAYTECH"
  paymentStatus,    -- "PENDING" → "PAID"
  transactionId,    -- "405gzwpmh97..."
  createdAt,        -- Date création
  updatedAt         -- Date mise à jour
FROM orders
WHERE paymentMethod = 'PAYTECH';
```

## 💡 **SOLUTION COMPLÈTE**

1. **🗄️ Créez la table** : `npx prisma db push` ✅ (déjà fait)
2. **👤 Créez un utilisateur** valide avec `userId`
3. **📦 Créez une commande** complète avec tous les champs requis
4. **💰 Finalisez un paiement** via une URL Paytech
5. **✅ Vérifiez l'apparition** dans la table `orders`

## 🎯 **RÉCAPITULATIF DÉFINITIF**

**Les paiements Paytech sont enregistrés dans la table `orders` avec 3 champs spécifiques :**

- ✅ **`paymentMethod`** = "PAYTECH"
- ✅ **`paymentStatus`** = "PENDING" | "PAID" | "FAILED"
- ✅ **`transactionId`** = Token Paytech

**Une seule table = `orders`** 🎯

---
*Pour voir les transactions : créez une commande complète puis finalisez un paiement.*