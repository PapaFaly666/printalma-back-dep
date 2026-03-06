# Documentation API - Gestion des Méthodes de Paiement

## Vue d'ensemble

Le système permet à l'administrateur de choisir quelles méthodes de paiement sont disponibles dans l'application :
- **PayDunya** (Paiement mobile Wave, Orange Money, Free Money via PayDunya)
- **Orange Money** (Paiement direct Orange Money)
- **Paiement à la livraison** (Cash on Delivery)

## Architecture

Le système utilise la table `PaymentConfig` dans Prisma pour stocker la configuration de chaque méthode de paiement, avec un champ `isActive` qui permet d'activer/désactiver chaque méthode.

---

## Endpoints Publics (Frontend)

### 1. Récupérer les méthodes de paiement disponibles

**Endpoint:** `GET /payment-methods`

**Description:** Retourne la liste de toutes les méthodes de paiement actives pour le checkout frontend.

**Authentification:** Non requise (endpoint public)

**Réponse:**
```json
{
  "paymentMethods": [
    {
      "provider": "PAYDUNYA",
      "isActive": true,
      "mode": "live",
      "label": "PayDunya"
    },
    {
      "provider": "ORANGE_MONEY",
      "isActive": true,
      "mode": "live",
      "label": "Orange Money"
    },
    {
      "provider": "CASH_ON_DELIVERY",
      "isActive": true,
      "mode": "live",
      "label": "Paiement à la livraison"
    }
  ]
}
```

**Utilisation Frontend:**
```javascript
// Exemple avec Axios
const response = await axios.get('/payment-methods');
const availableMethods = response.data.paymentMethods;

// Afficher les options de paiement disponibles
availableMethods.forEach(method => {
  console.log(`${method.label} - ${method.isActive ? 'Actif' : 'Inactif'}`);
});
```

---

### 2. Vérifier le statut du paiement à la livraison

**Endpoint:** `GET /payment-config/cash-on-delivery`

**Description:** Vérifie si le paiement à la livraison est activé.

**Authentification:** Non requise

**Réponse:**
```json
{
  "isEnabled": true
}
```

---

### 3. Récupérer la configuration publique d'une méthode spécifique

**Endpoint:** `GET /payment-config/:provider`

**Paramètres:**
- `provider` : `PAYDUNYA`, `ORANGE_MONEY`, ou `CASH_ON_DELIVERY`

**Description:** Retourne la configuration publique (clé publique, URL API, etc.) pour une méthode de paiement.

**Authentification:** Non requise

**Réponse:**
```json
{
  "provider": "PAYDUNYA",
  "isActive": true,
  "mode": "live",
  "publicKey": "test-public-key-xxxxx",
  "apiUrl": "https://app.paydunya.com/api/v1"
}
```

---

## Endpoints Admin (Backend)

### 1. Récupérer toutes les méthodes de paiement (Admin)

**Endpoint:** `GET /admin/payment-methods`

**Description:** Retourne la liste de TOUTES les méthodes de paiement (actives et inactives) pour l'interface admin.

**Authentification:** Requise (ADMIN ou SUPERADMIN)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Réponse:**
```json
[
  {
    "provider": "PAYDUNYA",
    "isActive": true,
    "mode": "live",
    "label": "PayDunya"
  },
  {
    "provider": "ORANGE_MONEY",
    "isActive": false,
    "mode": "test",
    "label": "Orange Money"
  },
  {
    "provider": "CASH_ON_DELIVERY",
    "isActive": true,
    "mode": "live",
    "label": "Paiement à la livraison"
  }
]
```

---

### 2. Activer/Désactiver une méthode de paiement

**Endpoint:** `PATCH /admin/payment-methods/:provider/toggle`

**Paramètres:**
- `provider` : `PAYDUNYA`, `ORANGE_MONEY`, ou `CASH_ON_DELIVERY`

**Body:**
```json
{
  "isActive": true
}
```

**Description:** Active ou désactive une méthode de paiement.

**Authentification:** Requise (ADMIN ou SUPERADMIN)

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Réponse:**
```json
{
  "provider": "ORANGE_MONEY",
  "isActive": true,
  "message": "ORANGE_MONEY activé avec succès"
}
```

**Exemple cURL:**
```bash
# Activer Orange Money
curl -X PATCH https://api.printalma.com/admin/payment-methods/ORANGE_MONEY/toggle \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'

# Désactiver PayDunya
curl -X PATCH https://api.printalma.com/admin/payment-methods/PAYDUNYA/toggle \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

---

### 3. Activer/Désactiver le paiement à la livraison (Alternative)

**Endpoint:** `POST /admin/payment-config/cash-on-delivery/toggle`

**Body:**
```json
{
  "isActive": true
}
```

**Description:** Alternative pour gérer le paiement à la livraison (endpoint legacy).

**Authentification:** Requise (ADMIN ou SUPERADMIN)

**Réponse:**
```json
{
  "isEnabled": true
}
```

---

## Interface Admin Frontend

### Page de gestion des méthodes de paiement

**Route suggérée:** `/admin/payment-methods`

**Fonctionnalités:**
1. Afficher la liste de toutes les méthodes de paiement avec leur statut
2. Permettre l'activation/désactivation via un toggle switch
3. Afficher le mode actuel (test/live) pour chaque méthode

**Exemple d'interface:**
```
┌─────────────────────────────────────────────────────────┐
│ Gestion des Méthodes de Paiement                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ PayDunya                          [✓ Activé]   [Live]   │
│ Paiement mobile (Wave, OM, Free)                        │
│                                                          │
│ Orange Money                      [  Désactivé] [Test]  │
│ Paiement direct Orange Money                            │
│                                                          │
│ Paiement à la livraison          [✓ Activé]   [Live]   │
│ Cash on Delivery                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Code exemple React:**
```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PaymentMethodsAdmin() {
  const [methods, setMethods] = useState([]);

  useEffect(() => {
    // Charger les méthodes de paiement
    axios.get('/admin/payment-methods', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(response => {
      setMethods(response.data);
    });
  }, []);

  const toggleMethod = async (provider, currentStatus) => {
    try {
      await axios.patch(`/admin/payment-methods/${provider}/toggle`, {
        isActive: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Recharger la liste
      const response = await axios.get('/admin/payment-methods', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMethods(response.data);

      alert('Méthode de paiement mise à jour avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="payment-methods-admin">
      <h1>Gestion des Méthodes de Paiement</h1>

      <div className="methods-list">
        {methods.map(method => (
          <div key={method.provider} className="method-card">
            <div className="method-info">
              <h3>{method.label}</h3>
              <span className={`badge ${method.mode}`}>{method.mode}</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={method.isActive}
                onChange={() => toggleMethod(method.provider, method.isActive)}
              />
              <span className="slider"></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Flux de paiement côté Frontend

### 1. Page de checkout

```javascript
// 1. Récupérer les méthodes disponibles
const { data } = await axios.get('/payment-methods');
const paymentMethods = data.paymentMethods;

// 2. Afficher uniquement les méthodes actives
paymentMethods.forEach(method => {
  if (method.provider === 'PAYDUNYA') {
    // Afficher l'option PayDunya
  } else if (method.provider === 'ORANGE_MONEY') {
    // Afficher l'option Orange Money
  } else if (method.provider === 'CASH_ON_DELIVERY') {
    // Afficher l'option Paiement à la livraison
  }
});
```

### 2. Gestion conditionnelle

```javascript
// Vérifier si une méthode spécifique est disponible
const isPaydunyaAvailable = paymentMethods.some(
  m => m.provider === 'PAYDUNYA' && m.isActive
);

const isOrangeMoneyAvailable = paymentMethods.some(
  m => m.provider === 'ORANGE_MONEY' && m.isActive
);

const isCodAvailable = paymentMethods.some(
  m => m.provider === 'CASH_ON_DELIVERY' && m.isActive
);
```

---

## Notes importantes

### Providers disponibles
- `PAYDUNYA` : Passerelle de paiement PayDunya (Wave, Orange Money, Free Money)
- `ORANGE_MONEY` : Paiement direct Orange Money
- `CASH_ON_DELIVERY` : Paiement à la livraison

### Sécurité
- Les endpoints admin (`/admin/*`) nécessitent une authentification JWT
- Seuls les utilisateurs avec le rôle `ADMIN` ou `SUPERADMIN` peuvent gérer les méthodes
- Les clés privées ne sont jamais exposées via les endpoints publics

### Modes de fonctionnement
- `test` : Mode sandbox/test
- `live` : Mode production

---

## Exemples d'utilisation complète

### Scénario 1 : Activer uniquement Orange Money

```bash
# 1. Désactiver PayDunya
curl -X PATCH https://api.printalma.com/admin/payment-methods/PAYDUNYA/toggle \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

# 2. Activer Orange Money
curl -X PATCH https://api.printalma.com/admin/payment-methods/ORANGE_MONEY/toggle \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'

# 3. Désactiver le paiement à la livraison
curl -X PATCH https://api.printalma.com/admin/payment-methods/CASH_ON_DELIVERY/toggle \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### Scénario 2 : Activer toutes les méthodes

```bash
# Activer PayDunya
curl -X PATCH https://api.printalma.com/admin/payment-methods/PAYDUNYA/toggle \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'

# Activer Orange Money
curl -X PATCH https://api.printalma.com/admin/payment-methods/ORANGE_MONEY/toggle \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'

# Activer le paiement à la livraison
curl -X PATCH https://api.printalma.com/admin/payment-methods/CASH_ON_DELIVERY/toggle \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'
```

---

## Troubleshooting

### Problème : Aucune méthode de paiement n'apparaît

**Solution :**
1. Vérifier que la configuration existe dans la base de données
2. S'assurer que `isActive` est bien à `true`
3. Vérifier que les clés API sont configurées correctement

### Problème : Erreur 404 lors de l'appel aux endpoints

**Solution :**
1. Vérifier que le module `PaymentConfigModule` est bien importé dans `app.module.ts`
2. Vérifier que les controllers sont bien déclarés dans le module
3. Redémarrer le serveur NestJS

### Problème : Erreur 401 Unauthorized sur les endpoints admin

**Solution :**
1. Vérifier que le token JWT est valide et non expiré
2. S'assurer que l'utilisateur a le rôle `ADMIN` ou `SUPERADMIN`
3. Vérifier que le header `Authorization` est correctement formaté : `Bearer <token>`

---

## Configuration initiale

Pour créer les configurations initiales des méthodes de paiement, utiliser les endpoints de création :

```bash
# Créer la configuration PayDunya
curl -X POST https://api.printalma.com/admin/payment-config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "PAYDUNYA",
    "isActive": true,
    "mode": "live",
    "masterKey": "YOUR_MASTER_KEY",
    "privateKey": "YOUR_PRIVATE_KEY",
    "token": "YOUR_TOKEN",
    "publicKey": "YOUR_PUBLIC_KEY"
  }'

# Créer la configuration Orange Money
curl -X POST https://api.printalma.com/admin/payment-config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "ORANGE_MONEY",
    "isActive": false,
    "mode": "test",
    "publicKey": "YOUR_CLIENT_ID",
    "privateKey": "YOUR_CLIENT_SECRET",
    "token": "YOUR_MERCHANT_CODE"
  }'
```

---

## Support

Pour toute question ou problème, contacter l'équipe de développement.
