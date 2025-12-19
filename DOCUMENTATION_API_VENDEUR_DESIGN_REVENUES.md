# 📋 Documentation API - Revenus des Designs (Vendeurs)

## 🎯 Vue d'ensemble

L'API des revenus de designs permet aux vendeurs de suivre et gérer leurs gains générés par l'utilisation de leurs designs dans les commandes des clients.

> **Note importante** : Tous les endpoints nécessitent une authentification JWT et le rôle `VENDEUR`.
> **Filtre automatique** : Seuls les designs avec `DesignUsage.paymentStatus = 'CONFIRMED'` sont affichés.

---

## 🔐 Authentification

### Étape 1 : Obtenir un token JWT

```bash
curl -X 'POST' \
  'http://localhost:3004/auth/login' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "pf.d@zig.univ.sn",
    "password": "votre-mot-de-passe"
  }'
```

**Réponse attendue :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 3,
    "email": "pf.d@zig.univ.sn",
    "firstName": "Papa Faly",
    "lastName": "Sidy",
    "role": "VENDEUR",
    "roleDisplay": "VENDEUR"
  }
}
```

### Étape 2 : Utiliser le token dans les requêtes

Ajoutez l'en-tête `Authorization: Bearer TOKEN` à toutes vos requêtes :

```bash
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📊 Endpoints Principaux

### 1. GET `/vendor/design-revenues/stats`

**Description** : Récupère les statistiques de revenus du vendeur (uniquement les designs CONFIRMED)

```bash
curl -X 'GET' \
  'http://localhost:3004/vendor/design-revenues/stats' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer VOTRE_TOKEN_JWT_ICI'
```

**Paramètres optionnels :**
- `period` : `week` | `month` | `year` | `all` (défaut: `month`)

```bash
curl -X 'GET' \
  'http://localhost:3004/vendor/design-revenues/stats?period=year' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer VOTRE_TOKEN_JWT_ICI'
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 150000,
    "pendingRevenue": 45000,
    "completedRevenue": 105000,
    "totalUsages": 25,
    "uniqueDesignsUsed": 8,
    "averageRevenuePerDesign": 18750
  }
}
```

### 2. GET `/vendor/design-revenues/designs`

**Description** : Récupère la liste des designs avec leurs revenus (uniquement les designs CONFIRMED)

```bash
curl -X 'GET' \
  'http://localhost:3004/vendor/design-revenues/designs' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer VOTRE_TOKEN_JWT_ICI'
```

**Paramètres optionnels :**
- `period` : `week` | `month` | `year` | `all` (défaut: `month`)
- `sortBy` : `revenue` | `usage` | `recent` (défaut: `revenue`)
- `search` : recherche par nom de design

```bash
curl -X 'GET' \
  'http://localhost:3004/vendor/design-revenues/designs?period=month&sortBy=revenue&search=tshirt' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer VOTRE_TOKEN_JWT_ICI'
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "designId": 1,
      "designName": "Design T-Shirt Cool",
      "designImage": "https://example.com/image.jpg",
      "designPrice": 5000,
      "totalUsages": 10,
      "totalRevenue": 35000,
      "pendingRevenue": 15000,
      "completedRevenue": 20000,
      "lastUsedAt": "2025-12-15T10:30:00.000Z",
      "usageHistory": [
        {
          "id": 1,
          "orderId": 123,
          "orderNumber": "CMD-2025-001",
          "customerName": "Jean Dupont",
          "productName": "T-Shirt Personnalisé",
          "usedAt": "2025-12-15T10:30:00.000Z",
          "revenue": 3500,
          "status": "COMPLETED",
          "commissionRate": 70
        }
      ]
    }
  ]
}
```

### 3. GET `/vendor/design-revenues/designs/:designId/history`

**Description** : Récupère l'historique d'utilisation d'un design spécifique (uniquement les commandes payées)

```bash
curl -X 'GET' \
  'http://localhost:3004/vendor/design-revenues/designs/1/history' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer VOTRE_TOKEN_JWT_ICI'
```

---

## 💰 Endpoints de Paiement

### 4. GET `/vendor/design-revenues/available-balance`

**Description** : Récupère le solde disponible pour retrait

```bash
curl -X 'GET' \
  'http://localhost:3004/vendor/design-revenues/available-balance' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer VOTRE_TOKEN_JWT_ICI'
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "balance": 85000
  }
}
```

### 5. POST `/vendor/design-revenues/payout`

**Description** : Crée une demande de retrait

```bash
curl -X 'POST' \
  'http://localhost:3004/vendor/design-revenues/payout' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer VOTRE_TOKEN_JWT_ICI' \
  -d '{
    "amount": 50000,
    "bankAccountId": 1
  }'
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "amount": 50000,
    "status": "PENDING",
    "requestedAt": "2025-12-15T10:30:00.000Z",
    "estimatedProcessingTime": "2-3 jours ouvrables"
  }
}
```

### 6. GET `/vendor/design-revenues/payouts`

**Description** : Récupère l'historique des demandes de paiement

```bash
curl -X 'GET' \
  'http://localhost:3004/vendor/design-revenues/payouts' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer VOTRE_TOKEN_JWT_ICI'
```

**Paramètres optionnels :**
- `page` : numéro de page (défaut: `1`)
- `limit` : éléments par page (défaut: `20`)

---

## 🏦 Endpoints Bancaires

### 7. GET `/vendor/design-revenues/bank-accounts`

**Description** : Récupère les comptes bancaires du vendeur

```bash
curl -X 'GET' \
  'http://localhost:3004/vendor/design-revenues/bank-accounts' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer VOTRE_TOKEN_JWT_ICI'
```

### 8. POST `/vendor/design-revenues/bank-accounts`

**Description** : Ajoute un nouveau compte bancaire

```bash
curl -X 'POST' \
  'http://localhost:3004/vendor/design-revenues/bank-accounts' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer VOTRE_TOKEN_JWT_ICI' \
  -d '{
    "bankName": "Banque ABC",
    "accountNumber": "12345678901234567890",
    "accountHolderName": "Papa Faly Sidy",
    "isDefault": true
  }'
```

---

## ⚙️ Configuration

### 9. GET `/vendor/design-revenues/settings`

**Description** : Récupère les paramètres de revenus

```bash
curl -X 'GET' \
  'http://localhost:3004/vendor/design-revenues/settings' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer VOTRE_TOKEN_JWT_ICI'
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "commissionRate": 70,
    "minimumPayoutAmount": 10000,
    "payoutDelayDays": 7,
    "payoutSchedule": "ON_DEMAND"
  }
}
```

---

## 🚨 Erreurs Communes

### 403 Forbidden
```json
{
  "message": "Forbidden resource",
  "error": "Forbidden",
  "statusCode": 403
}
```

**Causes possibles :**
- Token JWT manquant ou invalide
- L'utilisateur n'a pas le rôle `VENDEUR`
- Le design n'appartient pas au vendeur

**Solution :** Vérifiez votre token et assurez-vous d'avoir le rôle `VENDEUR`.

### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

**Causes possibles :**
- Token JWT expiré
- Token mal formaté

**Solution :** Reconnectez-vous pour obtenir un nouveau token.

### 400 Bad Request
```json
{
  "message": "Montant et compte bancaire requis",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Solution :** Vérifiez que tous les champs requis sont présents dans votre requête.

---

## 📱 Intégration Frontend

### Exemple en JavaScript

```javascript
// Configuration
const API_BASE = 'http://localhost:3004';
let authToken = localStorage.getItem('authToken');

// Fonction générique pour les requêtes API
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Exemple : Récupérer les statistiques
async function getRevenueStats(period = 'month') {
  try {
    const data = await apiRequest(`/vendor/design-revenues/stats?period=${period}`);
    console.log('Statistiques:', data.data);
    return data.data;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Exemple : Récupérer les designs avec revenus
async function getDesignRevenues(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const endpoint = params ? `/vendor/design-revenues/designs?${params}` : '/vendor/design-revenues/designs';

  try {
    const data = await apiRequest(endpoint);
    console.log('Designs:', data.data);
    return data.data;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Exemple : Créer une demande de retrait
async function createPayout(amount, bankAccountId) {
  try {
    const data = await apiRequest('/vendor/design-revenues/payout', {
      method: 'POST',
      body: JSON.stringify({ amount, bankAccountId })
    });
    console.log('Demande créée:', data.data);
    return data.data;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Utilisation
document.addEventListener('DOMContentLoaded', async () => {
  // Vérifier l'authentification
  if (!authToken) {
    window.location.href = '/login';
    return;
  }

  // Charger les données
  const stats = await getRevenueStats('month');
  const designs = await getDesignRevenues({ sortBy: 'revenue', period: 'month' });

  // Afficher les données dans le frontend
  updateUI(stats, designs);
});
```

### Gestion des erreurs

```javascript
// Gestionnaire d'erreurs global
function handleApiError(error, endpoint) {
  console.error(`Erreur API (${endpoint}):`, error);

  if (error.status === 401) {
    // Token expiré, rediriger vers login
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  } else if (error.status === 403) {
    // Pas autorisé, afficher message
    alert("Vous n'avez pas les permissions nécessaires");
  } else if (error.status >= 500) {
    // Erreur serveur
    alert("Erreur serveur, veuillez réessayer plus tard");
  }
}

// Utiliser avec try-catch
try {
  const stats = await getRevenueStats();
} catch (error) {
  handleApiError(error, '/vendor/design-revenues/stats');
}
```

---

## 📋 Résumé des Endpoints

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/vendor/design-revenues/stats` | Statistiques de revenus | ✅ |
| `GET` | `/vendor/design-revenues/designs` | Liste des designs avec revenus | ✅ |
| `GET` | `/vendor/design-revenues/designs/:id/history` | Historique d'un design | ✅ |
| `GET` | `/vendor/design-revenues/available-balance` | Solde disponible | ✅ |
| `POST` | `/vendor/design-revenues/payout` | Demande de retrait | ✅ |
| `GET` | `/vendor/design-revenues/payouts` | Historique des retraits | ✅ |
| `GET` | `/vendor/design-revenues/bank-accounts` | Comptes bancaires | ✅ |
| `POST` | `/vendor/design-revenues/bank-accounts` | Ajouter compte bancaire | ✅ |
| `PUT` | `/vendor/design-revenues/bank-accounts/:id/default` | Définir compte par défaut | ✅ |
| `DELETE` | `/vendor/design-revenues/bank-accounts/:id` | Supprimer compte bancaire | ✅ |
| `GET` | `/vendor/design-revenues/settings` | Paramètres de revenus | ✅ |

---

## 🔄 Workflow de Utilisation

1. **Connexion** : Obtenir un token JWT
2. **Dashboard** : Afficher les statistiques générales (`/stats`)
3. **Liste des designs** : Voir tous les designs avec revenus (`/designs`)
4. **Détails** : Consulter l'historique d'un design spécifique (`/designs/:id/history`)
5. **Solde** : Vérifier le montant disponible (`/available-balance`)
6. **Retrait** : Demander un paiement (`/payout`)
7. **Historique** : Suivre les demandes de retrait (`/payouts`)
8. **Configuration** : Gérer les comptes bancaires (`/bank-accounts`)

---

## 📞 Support

Pour toute question ou problème technique, veuillez contacter :
- **Documentation technique** : Voir la documentation Swagger complète
- **Logs** : Consulter les logs du serveur pour le débogage
- **Base de données** : Vérifier que les tables `DesignUsage` sont correctement configurées