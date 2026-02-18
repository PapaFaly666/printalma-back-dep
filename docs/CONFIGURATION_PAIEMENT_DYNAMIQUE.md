# Configuration Dynamique des Paiements Paydunya

## Vue d'ensemble

Le système de paiement Paydunya est maintenant entièrement configurable depuis l'interface d'administration, sans jamais avoir à modifier le code source. Les clés API et les paramètres sont stockés en base de données et peuvent être mis à jour à tout moment.

## Architecture

### Composants créés

1. **Table de base de données** : `payment_configs`
   - Stocke les configurations pour tous les providers de paiement
   - Supporte plusieurs providers (Paydunya, Paytech, etc.)
   - Une seule configuration active par provider

2. **Module PaymentConfig** : `src/payment-config/`
   - Service de gestion des configurations
   - Controllers pour admin et public
   - DTOs de validation

3. **Service Paydunya modifié**
   - Récupère dynamiquement les clés depuis la base de données
   - Fallback sur les variables d'environnement si aucune config en BDD
   - Aucune modification du code nécessaire pour changer les clés

## API Endpoints

### Endpoints Admin (Protection ADMIN/SUPERADMIN requise)

#### 1. Créer une configuration
```http
POST /admin/payment-config
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "provider": "paydunya",
  "isActive": true,
  "mode": "test",
  "masterKey": "1nMjPuqy-oa01-tJIO-g8J2-u1wfqxtUDnlj",
  "privateKey": "test_private_uImFqxfqokHqbqHI4PXJ24huucO",
  "token": "BuVS3uuAKsg9bYyGcT9B",
  "publicKey": "test_public_xyz123",
  "webhookSecret": "optional_webhook_secret"
}
```

**Réponse** :
```json
{
  "id": 1,
  "provider": "paydunya",
  "isActive": true,
  "mode": "test",
  "masterKey": "1nMj...Dnlj",
  "privateKey": "test...ucO",
  "token": "BuVS...9bYy",
  "publicKey": "test...123",
  "webhookSecret": "opti...ret",
  "createdAt": "2026-02-12T10:00:00Z",
  "updatedAt": "2026-02-12T10:00:00Z"
}
```

**Note** : Les clés sensibles sont automatiquement masquées dans les réponses API (affichées comme "xxxx...yyyy")

#### 2. Récupérer toutes les configurations
```http
GET /admin/payment-config
Authorization: Bearer <admin_token>
```

#### 3. Récupérer une configuration spécifique
```http
GET /admin/payment-config/paydunya
Authorization: Bearer <admin_token>
```

#### 4. Mettre à jour une configuration
```http
PATCH /admin/payment-config/paydunya
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "mode": "live",
  "masterKey": "live_master_key_xyz",
  "privateKey": "live_private_key_abc",
  "token": "live_token_123"
}
```

#### 5. Supprimer une configuration
```http
DELETE /admin/payment-config/paydunya
Authorization: Bearer <admin_token>
```

### Endpoints Publics (Accès libre)

#### 1. Récupérer la configuration publique
```http
GET /payment-config/paydunya
```

**Réponse** :
```json
{
  "provider": "paydunya",
  "isActive": true,
  "mode": "test",
  "publicKey": "test_public_xyz123",
  "apiUrl": "https://app.paydunya.com/sandbox-api/v1"
}
```

**Note** : Seules les informations publiques sont exposées. Les clés privées et sensibles ne sont JAMAIS retournées.

#### 2. Endpoint de commodité pour Paydunya
```http
GET /payment-config/paydunya/public
```

Retourne les mêmes informations que l'endpoint ci-dessus.

## Utilisation côté Frontend

### Récupérer la configuration Paydunya

```javascript
// Appel API pour récupérer la config
const response = await fetch('https://api.votre-domaine.com/payment-config/paydunya');
const config = await response.json();

console.log(config);
// {
//   "provider": "paydunya",
//   "isActive": true,
//   "mode": "test",
//   "publicKey": "test_public_xyz123",
//   "apiUrl": "https://app.paydunya.com/sandbox-api/v1"
// }

// Utiliser la configuration
if (config.isActive) {
  // Initialiser le SDK Paydunya avec la config
  const paydunyaSDK = new PaydunyaSDK({
    mode: config.mode,
    publicKey: config.publicKey,
    apiUrl: config.apiUrl
  });
}
```

### Exemple React/Next.js

```javascript
import { useEffect, useState } from 'react';

function PaymentComponent() {
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch('/api/payment-config/paydunya');
        const config = await response.json();
        setPaymentConfig(config);
      } catch (error) {
        console.error('Erreur chargement config paiement:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  if (loading) return <div>Chargement...</div>;

  if (!paymentConfig?.isActive) {
    return <div>Paiement temporairement indisponible</div>;
  }

  return (
    <div>
      <h2>Paiement {paymentConfig.mode === 'test' ? '(Mode Test)' : ''}</h2>
      {/* Votre composant de paiement */}
    </div>
  );
}
```

### Exemple avec Context API (Recommandé)

```javascript
// contexts/PaymentConfigContext.js
import { createContext, useContext, useEffect, useState } from 'react';

const PaymentConfigContext = createContext(null);

export function PaymentConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payment-config/paydunya')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <PaymentConfigContext.Provider value={{ config, loading }}>
      {children}
    </PaymentConfigContext.Provider>
  );
}

export function usePaymentConfig() {
  return useContext(PaymentConfigContext);
}

// Utilisation dans un composant
function CheckoutPage() {
  const { config, loading } = usePaymentConfig();

  if (loading) return <Spinner />;

  return (
    <div>
      {config?.isActive && (
        <PaymentButton config={config} />
      )}
    </div>
  );
}
```

## Guide d'utilisation Admin

### 1. Configuration initiale de Paydunya

1. Connectez-vous en tant qu'administrateur
2. Accédez à l'interface de configuration des paiements
3. Créez une nouvelle configuration :
   - **Provider** : `paydunya`
   - **Mode** : `test` (pour commencer)
   - **Master Key** : Votre clé master Paydunya
   - **Private Key** : Votre clé privée Paydunya
   - **Token** : Votre token Paydunya
   - **Actif** : `true`

4. Sauvegardez la configuration

### 2. Passer en mode production

1. Récupérez vos clés de production depuis Paydunya
2. Modifiez la configuration existante
3. Changez le mode de `test` à `live`
4. Mettez à jour les clés avec les clés de production
5. Sauvegardez

**Aucun redémarrage du serveur n'est nécessaire !**

### 3. Désactiver temporairement les paiements

1. Modifiez la configuration
2. Mettez `isActive` à `false`
3. Les paiements seront immédiatement désactivés

### 4. Tester la configuration

```bash
# Test de la connexion à l'API Paydunya
curl -X GET https://api.votre-domaine.com/paydunya/test-config
```

## Sécurité

### Clés masquées dans les réponses
Les clés sensibles sont automatiquement masquées dans toutes les réponses API admin :
- `masterKey`: "1nMj...Dnlj"
- `privateKey`: "test...ucO"
- `token`: "BuVS...9bYy"

Seules les 4 premiers et 4 derniers caractères sont affichés.

### Clés jamais exposées au public
Les endpoints publics (`/payment-config/:provider`) ne retournent **JAMAIS** :
- Master Key
- Private Key
- Token
- Webhook Secret

### Authentification requise pour l'admin
Tous les endpoints d'administration nécessitent :
- Token JWT valide
- Rôle ADMIN ou SUPERADMIN

## Fallback sur variables d'environnement

Si aucune configuration n'est trouvée en base de données, le système utilise automatiquement les variables d'environnement :

```env
PAYDUNYA_MASTER_KEY=your_master_key
PAYDUNYA_PRIVATE_KEY=your_private_key
PAYDUNYA_TOKEN=your_token
PAYDUNYA_MODE=test
```

Ceci assure une compatibilité descendante et évite les interruptions de service.

## Providers supportés

### Actuellement implémentés
- `paydunya` : Paydunya Payment Gateway

### Futurs providers (extensibles)
- `paytech` : Paytech Payment Gateway
- `stripe` : Stripe
- `wave` : Wave
- Tout autre provider peut être facilement ajouté

## Ajout d'un nouveau provider

Pour ajouter un nouveau provider de paiement :

1. Ajoutez le provider dans l'enum :
```typescript
// src/payment-config/dto/create-payment-config.dto.ts
export enum PaymentProvider {
  PAYDUNYA = 'paydunya',
  PAYTECH = 'paytech', // Nouveau provider
}
```

2. Créez le service correspondant
3. Injectez `PaymentConfigService` dans votre nouveau service
4. Récupérez la config avec `getActiveConfig(PaymentProvider.PAYTECH)`

## Schéma de la table

```sql
CREATE TABLE "payment_configs" (
  "id" SERIAL PRIMARY KEY,
  "provider" VARCHAR(50) UNIQUE NOT NULL,
  "is_active" BOOLEAN DEFAULT false,
  "mode" VARCHAR(10) DEFAULT 'test',
  "master_key" VARCHAR(255),
  "private_key" VARCHAR(255) NOT NULL,
  "token" VARCHAR(255) NOT NULL,
  "public_key" VARCHAR(255),
  "webhook_secret" VARCHAR(255),
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_payment_configs_provider" ON "payment_configs"("provider");
CREATE INDEX "idx_payment_configs_is_active" ON "payment_configs"("is_active");
```

## Troubleshooting

### Erreur: "Configuration PayDunya manquante"
**Cause** : Aucune configuration active en BDD et aucune variable d'environnement

**Solution** :
1. Vérifiez qu'une configuration existe en BDD
2. Vérifiez que `isActive` est à `true`
3. Ou configurez les variables d'environnement

### Les clés ne se mettent pas à jour
**Cause** : Cache ou erreur de synchronisation

**Solution** :
1. Les clés sont chargées à chaque requête, aucun cache
2. Vérifiez que la mise à jour en BDD a bien été effectuée
3. Consultez les logs du serveur

### Le frontend ne reçoit pas les clés
**Cause** : CORS ou endpoint incorrect

**Solution** :
1. Vérifiez que vous appelez `/payment-config/paydunya` (sans `/admin/`)
2. Vérifiez les paramètres CORS
3. Les clés privées ne sont jamais exposées - c'est normal !

## Migration depuis variables d'environnement

### Script de migration (à exécuter une fois)

```bash
# Créer la configuration depuis les variables d'env actuelles
curl -X POST https://api.votre-domaine.com/admin/payment-config \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paydunya",
    "isActive": true,
    "mode": "'$PAYDUNYA_MODE'",
    "masterKey": "'$PAYDUNYA_MASTER_KEY'",
    "privateKey": "'$PAYDUNYA_PRIVATE_KEY'",
    "token": "'$PAYDUNYA_TOKEN'"
  }'
```

Après migration, vous pouvez supprimer les variables d'environnement Paydunya du fichier `.env`.

## Changelog

### Version 1.0.0 (2026-02-12)
- ✅ Configuration dynamique Paydunya depuis BDD
- ✅ Endpoints admin CRUD complets
- ✅ Endpoint public pour frontend
- ✅ Masquage automatique des clés sensibles
- ✅ Fallback sur variables d'environnement
- ✅ Support multi-providers
- ✅ Documentation complète

---

**Auteur** : Système de configuration dynamique des paiements
**Date** : 12 Février 2026
**Version** : 1.0.0
