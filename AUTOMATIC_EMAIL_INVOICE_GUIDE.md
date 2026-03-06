# 📧 Guide : Envoi Automatique d'Email de Facture

## 🎯 Objectif

Envoyer automatiquement un email de facture au client **dès que son paiement est confirmé**.

---

## ✅ Comment ça marche (Flux actuel)

### 1. **Création de commande**
Quand le client passe commande depuis le frontend (`ModernOrderFormPage`), le payload doit contenir :

```javascript
{
  email: "client@example.com",  // ⚠️ OBLIGATOIRE pour recevoir la facture
  phoneNumber: "+221771234567",
  shippingDetails: { ... },
  orderItems: [
    {
      productId: 1,          // Pour produit normal
      // OU
      vendorProductId: 5,    // Pour produit vendeur
      mockupUrl: "https://...",  // Image du produit personnalisé
      quantity: 1,
      unitPrice: 15000,
      size: "L",
      color: "Noir"
    }
  ],
  paymentMethod: "PAYDUNYA",  // ou PAYTECH, ORANGE_MONEY
  initiatePayment: true
}
```

**Backend** : `src/order/order.service.ts:248`
```typescript
email: createOrderDto.email || null, // 🆕 Email du client stocké
```

### 2. **Paiement confirmé**
Quand le webhook de paiement reçoit la confirmation :

**Backend** : `src/order/order.service.ts:869-896`
```typescript
if (paymentStatus === 'PAID') {
  // ✅ EMAIL ENVOYÉ AUTOMATIQUEMENT ICI
  if (!updatedOrder.email) {
    this.logger.warn(`⚠️ EMAIL MANQUANT - Impossible d'envoyer la facture`);
  } else {
    await this.mailService.sendOrderInvoice(updatedOrder);
    this.logger.log(`✅ Facture envoyée à ${updatedOrder.email}`);
  }
}
```

### 3. **Construction de l'email**
Le service `MailService` génère l'email HTML avec :

**Backend** : `src/core/mail/mail.service.ts:1735-1750`
```typescript
// Pour PRODUITS VENDEURS
if (item.vendorProductId && item.vendorProduct?.finalImageUrl) {
  rawImage = item.vendorProduct.finalImageUrl;
}
// Pour PRODUITS NORMAUX
else if (item.mockupUrl) {
  rawImage = item.mockupUrl;
}

// Conversion en URL absolue pour les emails
const productImage = this.toAbsoluteUrl(rawImage) || 'https://via.placeholder.com/80?text=Image';
```

---

## 🐛 Problèmes courants et solutions

### ❌ Problème 1 : Email non envoyé

**Symptôme** : Aucun email reçu après paiement

**Causes possibles** :

1. **Email manquant lors de la création**
   ```bash
   # Vérifier les logs
   ⚠️  [Invoice] IMPOSSIBLE d'envoyer la facture : EMAIL MANQUANT
   ```

   **Solution** : S'assurer que le frontend envoie le champ `email` dans le payload

2. **Paiement non marqué comme PAID**
   ```bash
   # Vérifier le statut de la commande
   SELECT orderNumber, email, paymentStatus FROM "Order" WHERE orderNumber = 'ORD-XXX';
   ```

   **Solution** : Vérifier que le webhook de paiement appelle bien `updatePaymentStatus('PAID')`

3. **Erreur SMTP**
   ```bash
   # Vérifier les logs
   ❌ [MailService] Erreur lors de l'envoi de la facture
   ```

   **Solution** : Vérifier la configuration SMTP dans `.env`

---

### ❌ Problème 2 : Image du produit non visible

**Symptôme** : Email reçu mais image manquante/cassée

**Causes possibles** :

1. **URL relative au lieu d'absolue**
   ```bash
   # Vérifier les logs
   📸 [MailService] Image: /uploads/mockup.png  # ❌ Relative
   🔗 [MailService] Image finale: https://printalma.com/uploads/mockup.png  # ✅ Absolue
   ```

   **Solution** : La conversion est automatique via `toAbsoluteUrl()`. Vérifier que `FRONTEND_URL` est configuré dans `.env`

2. **mockupUrl ou finalImageUrl manquant**
   ```bash
   # Vérifier les logs
   ⚠️  [MailService] Aucune image pour "T-Shirt"
   ```

   **Solution** :
   - Pour produits normaux : Vérifier que `mockupUrl` est généré lors de la personnalisation
   - Pour produits vendeurs : Vérifier que `finalImageUrl` est présent dans `VendorProduct`

3. **Query ne charge pas vendorProduct**

   **Solution** : Vérifier que la query inclut `vendorProduct` avec `finalImageUrl`
   ```typescript
   // ✅ BON
   include: {
     vendorProduct: {
       select: {
         id: true,
         name: true,
         finalImageUrl: true,
       }
     }
   }
   ```

---

## 🔍 Debugging

### Étape 1 : Vérifier qu'une commande a un email

```bash
node check-order-email.js ORD-1234567890
```

Sortie attendue :
```
✅ Cette commande a un email: client@example.com
📸 Images des produits:
  Article 1:
    • vendorProduct.finalImageUrl: https://cloudinary.com/image.jpg
```

### Étape 2 : Tester l'envoi manuel

```bash
node test-send-email-order.js ORD-1234567890
```

Sortie attendue :
```json
{
  "success": true,
  "message": "Invoice sent to client@example.com"
}
```

### Étape 3 : Analyser les logs du serveur

Lors du paiement, vous devriez voir :

```
✅ Payment status updated for order ORD-XXX
📧 [Invoice] ✅ Email présent: client@example.com
📧 [Invoice] Envoi de la facture pour commande ORD-XXX...
📧 [MailService] sendOrderInvoice appelée pour commande ORD-XXX
📧 [MailService] Email destination: client@example.com
📧 [MailService] Nombre d'items: 2
📸 [MailService] Produit vendeur "T-Shirt Custom" - Image: https://cloudinary.com/xxx.jpg
🔗 [MailService] Image finale pour "T-Shirt Custom": https://printalma.com/xxx.jpg
📧 [MailService] Envoi de l'email à client@example.com...
✅ [MailService] Facture envoyée avec succès à client@example.com
```

---

## 📝 Checklist Frontend (ModernOrderFormPage)

Pour que l'email soit envoyé automatiquement, le frontend doit :

- [ ] Demander l'email au client (champ requis ou optionnel avec placeholder)
- [ ] Inclure `email` dans le payload de création de commande
- [ ] Inclure `mockupUrl` pour chaque item (produit personnalisé)
- [ ] Pour produits vendeurs : S'assurer que `vendorProductId` est présent

Exemple de payload :
```javascript
const orderPayload = {
  email: formData.email,  // ⚠️ Ne pas oublier !
  phoneNumber: formData.phone,
  shippingDetails: { ... },
  orderItems: cartItems.map(item => ({
    vendorProductId: item.vendorProductId,
    mockupUrl: item.customizedImage,  // ⚠️ Image générée
    quantity: item.quantity,
    unitPrice: item.price,
    size: item.size,
    color: item.color
  })),
  paymentMethod: "PAYDUNYA",
  initiatePayment: true
};
```

---

## 🔧 Configuration requise

### `.env`
```bash
# SMTP pour l'envoi d'emails
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# URL frontend pour les images
FRONTEND_URL="https://printalma.com"
```

---

## 📊 Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/core/mail/mail.service.ts:1735-1750` | Logique pour différencier produits vendeurs et normaux |
| `src/core/mail/mail.service.ts:40-58` | Méthode `toAbsoluteUrl()` pour convertir URLs relatives |
| `src/order/order.service.ts:847-863` | Include `vendorProduct` avec `finalImageUrl` |
| `src/order/order.service.ts:882-896` | Logs détaillés pour l'envoi automatique |

---

## ✅ Résumé

1. ✅ **L'envoi automatique fonctionne** : Code déjà implémenté dans `order.service.ts:882-896`
2. ✅ **Images gérées** : `finalImageUrl` pour vendeurs, `mockupUrl` pour normaux
3. ✅ **Logs ajoutés** : Trace complète du flux d'envoi
4. ⚠️ **Action requise** : Vérifier que le frontend envoie bien l'`email` dans le payload

**Test final** : Créer une commande depuis le frontend et payer. L'email devrait arriver automatiquement ! 🎉
