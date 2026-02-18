# Référence Rapide - Endpoints API

## Base URL
```
http://localhost:3004
```

---

## Endpoints Publics (Frontend)

### Récupérer la Configuration Active de Paydunya

```http
GET /payment-config/paydunya
```

**Headers**: Aucun

**Réponse**:
```json
{
  "provider": "paydunya",
  "isActive": true,
  "mode": "test",
  "publicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "apiUrl": "https://app.paydunya.com/sandbox-api/v1"
}
```

**Exemple cURL**:
```bash
curl http://localhost:3004/payment-config/paydunya
```

**Exemple JavaScript**:
```javascript
const config = await fetch('http://localhost:3004/payment-config/paydunya')
  .then(res => res.json());
```

---

## Endpoints Admin (Auth Requise)

**Headers requis pour tous les endpoints admin**:
```
Authorization: Bearer <votre_token_jwt>
Content-Type: application/json
```

---

### 1. Lister Toutes les Configurations

```http
GET /admin/payment-config
```

**Exemple cURL**:
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3004/admin/payment-config
```

---

### 2. Récupérer la Configuration d'un Provider

```http
GET /admin/payment-config/paydunya
```

**Réponse**:
```json
{
  "id": 1,
  "provider": "paydunya",
  "isActive": true,
  "activeMode": "test",
  "testPublicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "testPrivateKey": "test...ucO",
  "testToken": "BuVS...9B",
  "testMasterKey": null,
  "livePublicKey": "live_public_JzyUBGQTafgpOPqRulSDGDVfHzz",
  "livePrivateKey": "live...TG",
  "liveToken": "lt8Y...8f",
  "liveMasterKey": null,
  "webhookSecret": null,
  "metadata": {},
  "createdAt": "2026-02-12T10:34:12.000Z",
  "updatedAt": "2026-02-12T14:57:13.000Z"
}
```

**Exemple cURL**:
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3004/admin/payment-config/paydunya
```

---

### 3. Basculer entre TEST et LIVE ⭐

```http
POST /admin/payment-config/switch
```

**Body** (Basculer vers LIVE):
```json
{
  "provider": "paydunya",
  "mode": "live"
}
```

**Body** (Basculer vers TEST):
```json
{
  "provider": "paydunya",
  "mode": "test"
}
```

**Réponse**:
```json
{
  "message": "Basculement réussi vers le mode LIVE",
  "config": {
    "id": 1,
    "provider": "paydunya",
    "activeMode": "live",
    ...
  },
  "previousMode": "test",
  "currentMode": "live"
}
```

**Exemple cURL** (vers LIVE):
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"provider":"paydunya","mode":"live"}' \
  http://localhost:3004/admin/payment-config/switch
```

**Exemple cURL** (vers TEST):
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"provider":"paydunya","mode":"test"}' \
  http://localhost:3004/admin/payment-config/switch
```

**Exemple JavaScript**:
```javascript
const response = await fetch('http://localhost:3004/admin/payment-config/switch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    provider: 'paydunya',
    mode: 'live'  // ou 'test'
  })
});

const result = await response.json();
console.log(result.message); // "Basculement réussi vers le mode LIVE"
```

---

### 4. Créer une Configuration

```http
POST /admin/payment-config
```

**Body**:
```json
{
  "provider": "paydunya",
  "isActive": true,
  "mode": "test",
  "publicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "privateKey": "test_private_uImFqxfqokHqbqHI4PXJ24huucO",
  "token": "BuVS3uuAKsg9bYyGcT9B",
  "masterKey": null,
  "webhookSecret": null
}
```

**Exemple cURL**:
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paydunya",
    "isActive": true,
    "mode": "test",
    "publicKey": "test_public_...",
    "privateKey": "test_private_...",
    "token": "BuVS..."
  }' \
  http://localhost:3004/admin/payment-config
```

---

### 5. Mettre à Jour une Configuration

```http
PATCH /admin/payment-config/paydunya
```

**Body** (Ajouter les clés LIVE):
```json
{
  "mode": "live",
  "publicKey": "live_public_JzyUBGQTafgpOPqRulSDGDVfHzz",
  "privateKey": "live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG",
  "token": "lt8YNn0GPW6DTIWcCZ8f"
}
```

**Body** (Mettre à jour les clés TEST):
```json
{
  "mode": "test",
  "publicKey": "test_public_NEW_KEY",
  "privateKey": "test_private_NEW_KEY",
  "token": "NEW_TOKEN"
}
```

**Exemple cURL**:
```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "live",
    "publicKey": "live_public_...",
    "privateKey": "live_private_...",
    "token": "lt8Y..."
  }' \
  http://localhost:3004/admin/payment-config/paydunya
```

---

### 6. Supprimer une Configuration

```http
DELETE /admin/payment-config/paydunya
```

**Réponse**:
```json
{
  "message": "Configuration supprimée avec succès"
}
```

**Exemple cURL**:
```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  http://localhost:3004/admin/payment-config/paydunya
```

---

## Codes de Statut HTTP

| Code | Signification | Description |
|------|---------------|-------------|
| 200 | OK | Succès |
| 201 | Created | Ressource créée |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Non authentifié |
| 403 | Forbidden | Accès refusé (rôle insuffisant) |
| 404 | Not Found | Ressource non trouvée |
| 500 | Internal Server Error | Erreur serveur |

---

## Exemples d'Erreurs

### 401 - Non Authentifié
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 - Accès Refusé
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 - Configuration Non Trouvée
```json
{
  "statusCode": 404,
  "message": "Configuration non trouvée pour paydunya",
  "error": "Not Found"
}
```

### 400 - Clés Non Configurées
```json
{
  "statusCode": 400,
  "message": "Les clés LIVE ne sont pas configurées pour paydunya",
  "error": "Bad Request"
}
```

---

## Authentification

### Obtenir un Token JWT

L'authentification dépend de votre système. Typiquement:

```http
POST /auth/login
```

**Body**:
```json
{
  "email": "admin@example.com",
  "password": "votre_password"
}
```

**Réponse**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### Utiliser le Token

Dans toutes les requêtes admin, ajoutez:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Exemples Complets

### Exemple 1: Workflow Frontend Simple

```javascript
// 1. Récupérer la config active
const config = await fetch('http://localhost:3004/payment-config/paydunya')
  .then(res => res.json());

console.log('Mode:', config.mode); // "test" ou "live"
console.log('Public Key:', config.publicKey);

// 2. Utiliser dans votre app
if (config.mode === 'live') {
  console.warn('⚠️ MODE PRODUCTION - Paiements réels');
}

// 3. Créer un paiement avec votre backend
const payment = await createPayment({
  amount: 10000,
  config: config
});
```

---

### Exemple 2: Admin - Basculer de Mode

```javascript
// 1. Récupérer le token
const token = localStorage.getItem('authToken');

// 2. Basculer en mode LIVE
const response = await fetch('http://localhost:3004/admin/payment-config/switch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    provider: 'paydunya',
    mode: 'live'
  })
});

const result = await response.json();

if (response.ok) {
  alert(`✅ ${result.message}`);
  console.log('Ancien mode:', result.previousMode);
  console.log('Nouveau mode:', result.currentMode);
} else {
  alert(`❌ Erreur: ${result.message}`);
}
```

---

### Exemple 3: Vérifier le Mode Avant un Paiement

```javascript
async function processPayment(amount) {
  // 1. Récupérer la config
  const config = await fetch('http://localhost:3004/payment-config/paydunya')
    .then(res => res.json());

  // 2. Avertir si mode LIVE
  if (config.mode === 'live') {
    const confirmed = confirm(
      `⚠️ PAIEMENT RÉEL de ${amount} FCFA\n\nConfirmer ?`
    );
    if (!confirmed) return;
  }

  // 3. Procéder au paiement
  const invoice = await fetch('http://localhost:3004/paydunya/create-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoice: {
        total_amount: amount,
        description: 'Achat produit'
      },
      customer: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    })
  }).then(res => res.json());

  // 4. Rediriger vers Paydunya
  window.location.href = invoice.response_url;
}
```

---

## Tests avec cURL

### Test 1: Récupérer la Config (Public)

```bash
curl http://localhost:3004/payment-config/paydunya
```

---

### Test 2: Lister les Configs (Admin)

```bash
# Remplacez <token> par votre token JWT
curl -H "Authorization: Bearer <token>" \
  http://localhost:3004/admin/payment-config
```

---

### Test 3: Basculer en LIVE (Admin)

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"provider":"paydunya","mode":"live"}' \
  http://localhost:3004/admin/payment-config/switch
```

---

### Test 4: Basculer en TEST (Admin)

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"provider":"paydunya","mode":"test"}' \
  http://localhost:3004/admin/payment-config/switch
```

---

## Résumé Visuel

```
┌─────────────────────────────────────────────────┐
│              ENDPOINTS PUBLICS                  │
├─────────────────────────────────────────────────┤
│  GET /payment-config/paydunya                   │
│  → Récupère la config active (TEST ou LIVE)     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              ENDPOINTS ADMIN                    │
│          (Auth Bearer Token requis)             │
├─────────────────────────────────────────────────┤
│  GET    /admin/payment-config                   │
│  → Liste toutes les configs                     │
│                                                 │
│  GET    /admin/payment-config/paydunya          │
│  → Détails d'une config                         │
│                                                 │
│  POST   /admin/payment-config/switch  ⭐        │
│  → Basculer TEST ↔ LIVE                         │
│                                                 │
│  POST   /admin/payment-config                   │
│  → Créer une config                             │
│                                                 │
│  PATCH  /admin/payment-config/paydunya          │
│  → Mettre à jour une config                     │
│                                                 │
│  DELETE /admin/payment-config/paydunya          │
│  → Supprimer une config                         │
└─────────────────────────────────────────────────┘
```

---

## Notes Importantes

1. **Base URL**: `http://localhost:3004`

2. **Authentification Admin**:
   - Header: `Authorization: Bearer <token>`
   - Rôle requis: ADMIN ou SUPERADMIN

3. **Content-Type**:
   - Toujours `application/json` pour POST/PATCH

4. **Mode Switching**:
   - Endpoint le plus utilisé: `POST /admin/payment-config/switch`
   - Change instantanément le mode actif

5. **Sécurité**:
   - Les clés privées ne sont jamais exposées au frontend
   - Seul l'endpoint public est accessible sans auth

---

**Date**: 12 Février 2026
**Version**: 2.0.0
