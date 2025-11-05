# 📋 Système d'Enregistrement de Commandes - Guide Complet

## 🎯 Vue d'ensemble

Ce système complet permet d'enregistrer des commandes et de gérer les paiements Paydunya pour la plateforme PrintAlma.

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Paydunya      │
│   (Port 3001)   │◄──►│   (Port 3004)   │◄──►│   Paiement      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ React Components│    │ NestJS/Prisma   │    │ Webhook API     │
│ Order Forms     │    │ Order Service   │    │ Status Updates  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🛠️ Outils Disponibles

### 1. Script d'Automatisation Complet
**Fichier**: `create-order-complete.sh`

Script Bash complet pour créer des commandes et gérer les paiements Paydunya.

#### Utilisation de base

```bash
# Exécution complète (vérification + commande + paiement)
./create-order-complete.sh

# Vérifier le serveur uniquement
./create-order-complete.sh --check

# Voir les produits disponibles
./create-order-complete.sh --products

# Vérifier le statut d'un paiement
./create-order-complete.sh --status --token test_abc123

# Afficher les URLs de redirection
./create-order-complete.sh --urls
```

#### Fonctionnalités du script

✅ **Vérification automatique du serveur**
- Vérifie si le backend est accessible sur le port 3004
- Affiche l'état de connexion à la base de données

✅ **Récupération des produits**
- Interroge l'API pour obtenir les produits disponibles
- Affiche les prix et stocks en temps réel

✅ **Création de commande guidée**
- Formulaire interactif pour les informations client
- Validation automatique des données
- Calcul du montant total

✅ **Génération de paiement Paydunya**
- Création automatique du token de paiement
- Génération de l'URL de paiement sécurisée
- Configuration des URLs de redirection

✅ **Vérification du statut**
- Suivi en temps réel du statut de paiement
- Affichage des détails de la transaction

---

## 📊 Flux d'Enregistrement Complet

### Étape 1: Préparation

```bash
# 1. Démarrer le serveur backend
npm run start:dev

# 2. Vérifier l'état du système
./create-order-complete.sh --check
```

### Étape 2: Création de Commande

```bash
# Exécuter le script complet
./create-order-complete.sh
```

Le script vous guidera à travers:

1. **Informations client**
   - Prénom, Nom, Email, Téléphone
   - Validation automatique des formats

2. **Adresse de livraison**
   - Rue, Ville, Code postal, Pays
   - Formatage automatique

3. **Détails de la commande**
   - Sélection du produit
   - Quantité et prix
   - Calcul du total

### Étape 3: Paiement Paydunya

Le script génère automatiquement:

- **URL de paiement**: `https://paydunya.com/sandbox/checkout/invoice/TOKEN`
- **URL de succès**: `http://localhost:3004/payment/success?token=TOKEN`
- **URL d'annulation**: `http://localhost:3004/payment/cancel?token=TOKEN`
- **Webhook**: `http://localhost:3004/paydunya/callback`

### Étape 4: Suivi et Vérification

```bash
# Vérifier le statut d'un paiement
./create-order-complete.sh --status --token VOTRE_TOKEN
```

---

## 🎨 Composants Frontend (Exemples)

### 1. Formulaire de Commande Complet

```typescript
// src/components/OrderForm.tsx
interface OrderFormData {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingDetails: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  orderItems: {
    productId: number;
    quantity: number;
    unitPrice?: number;
  }[];
  paymentMethod: 'PAYDUNYA' | 'PAYTECH' | 'CASH_ON_DELIVERY';
  initiatePayment: boolean;
  notes?: string;
}
```

### 2. Service de Commande

```typescript
// src/services/orderService.ts
export const createOrder = async (orderData: OrderFormData) => {
  const response = await fetch('http://localhost:3004/orders/guest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData)
  });

  return response.json();
};
```

### 3. Gestion du Paiement

```typescript
// src/services/paymentService.ts
export const initiatePayment = async (orderId: number) => {
  const response = await fetch(`http://localhost:3004/paydunya/pay/${orderId}`, {
    method: 'POST'
  });

  const data = await response.json();

  // Rediriger vers Paydunya
  if (data.success && data.payment_url) {
    window.location.href = data.payment_url;
  }
};
```

---

## 🔗 Points d'Accès API

### 1. Création de Commande (Guest)

```http
POST /orders/guest
Content-Type: application/json

{
  "customerInfo": {
    "firstName": "Moussa",
    "lastName": "Diagne",
    "email": "moussa.diagne@example.com",
    "phone": "775588836"
  },
  "shippingDetails": {
    "street": "Rue du Commerce 123",
    "city": "Dakar",
    "postalCode": "10000",
    "country": "Sénégal"
  },
  "orderItems": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 6000
    }
  ],
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true,
  "notes": "Test commande"
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Commande invité créée avec succès",
  "data": {
    "id": 42,
    "orderNumber": "ORD-1762290063058",
    "status": "PENDING",
    "totalAmount": 12000,
    "payment": {
      "token": "test_yiT6XeF7S5"
    }
  }
}
```

### 2. Vérification du Statut

```http
GET /paydunya/status/{token}
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "response_code": "00",
    "response_text": "Transaction Found",
    "payment_status": "completed",
    "total_amount": 12000
  }
}
```

---

## 🧪 Tests et Validation

### 1. Script de Test Automatisé

```bash
# Test complet avec validation
./test-order-paydunya.sh
```

### 2. Tests Manuels

```bash
# 1. Créer une commande
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d @order-payload.json

# 2. Vérifier le statut
curl http://localhost:3004/paydunya/status/test_TOKEN

# 3. Simuler un webhook
curl -X POST http://localhost:3004/paydunya/callback \
  -H "Content-Type: application/json" \
  -d @webhook-payload.json
```

---

## 📋 Checklist de Déploiement

### ✅ Configuration Backend

- [ ] Base de données PostgreSQL connectée
- [ ] Variables d'environnement Paydunya configurées
- [ ] URLs de callback HTTPS configurées
- [ ] Webhook Paydunya activé

### ✅ Configuration Frontend

- [ ] API URL pointant vers le backend
- [] Pages de redirection (success/cancel) créées
- [] Formulaire de commande validé
- [] Gestion des erreurs implémentée

### ✅ Tests de Validation

- [ ] Flux de création de commande fonctionnel
- [ ] Redirection Paydunya opérationnelle
- [ ] Webhook de confirmation reçu
- [ ] Mise à jour automatique du statut

---

## 🔧 Dépannage

### Problèmes Courants

1. **Serveur inaccessible**
   ```bash
   # Vérifier le statut
   ./create-order-complete.sh --check

   # Redémarrer si nécessaire
   npm run start:dev
   ```

2. **Connexion base de données**
   ```bash
   # Vérifier les logs
   docker logs postgres

   # Redémarrer PostgreSQL
   sudo systemctl restart postgresql
   ```

3. **Token Paydunya invalide**
   ```bash
   # Vérifier la configuration
   grep PAYDUNYA .env

   # Régénérer les clés si nécessaire
   ```

4. **Webhook non reçu**
   ```bash
   # Vérifier la configuration webhook
   ./test-webhook-verify.sh
   ```

---

## 📈 Monitoring et Logs

### 1. Logs Backend

```bash
# Voir les logs en temps réel
tail -f logs/app.log

# Vérifier les erreurs de paiement
grep "Paydunya" logs/app.log
```

### 2. Monitoring Base de Données

```bash
# Vérifier les commandes récentes
psql -d printalma -c "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;"

# Vérifier les tentatives de paiement
psql -d printalma -c "SELECT * FROM payment_attempts ORDER BY created_at DESC LIMIT 5;"
```

---

## 🎯 Prochaines Étapes

1. **Production**
   - Mettre à jour les URLs vers HTTPS
   - Configurer les clés Paydunya live
   - Activer le monitoring complet

2. **Extensions**
   - Ajouter d'autres méthodes de paiement
   - Implémenter les notifications email/SMS
   - Créer un dashboard admin

3. **Optimisations**
   - Mettre en cache les produits
   - Optimiser les performances
   - Ajouter la pagination

---

## 📞 Support

Pour toute question ou problème technique:

- **Documentation complète**: `FRONTEND_ORDER_PAYDUNYA_GUIDE.md`
- **Script de test**: `create-order-complete.sh`
- **API Documentation**: `http://localhost:3004/api-docs`

*Ce système est prêt pour une utilisation en production après configuration des URLs HTTPS et des clés Paydunya live.*