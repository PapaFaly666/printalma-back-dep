# Guide Frontend - API de Configuration de Paiement

## URL de Base
```
http://localhost:3004
```

---

## Table des Matières
1. [Endpoints Publics (Frontend)](#endpoints-publics-frontend)
2. [Endpoints Admin](#endpoints-admin)
3. [Exemples de Code Frontend](#exemples-de-code-frontend)
4. [Intégration avec Paydunya](#intégration-avec-paydunya)
5. [Gestion des Erreurs](#gestion-des-erreurs)

---

## Endpoints Publics (Frontend)

### 1. Récupérer la Configuration Active de Paydunya

**Endpoint**: `GET /payment-config/paydunya`

**Description**: Récupère la configuration active (TEST ou LIVE) pour Paydunya. Retourne uniquement les données sécurisées (pas de clés privées).

**Authentification**: Aucune (public)

**Requête**:
```http
GET http://localhost:3004/payment-config/paydunya
Content-Type: application/json
```

**Réponse Success (200)**:
```json
{
  "provider": "paydunya",
  "isActive": true,
  "mode": "test",
  "publicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "apiUrl": "https://app.paydunya.com/sandbox-api/v1"
}
```

**Réponse Success (Mode LIVE)**:
```json
{
  "provider": "paydunya",
  "isActive": true,
  "mode": "live",
  "publicKey": "live_public_JzyUBGQTafgpOPqRulSDGDVfHzz",
  "apiUrl": "https://app.paydunya.com/api/v1"
}
```

**Réponse Error (404)** - Aucune configuration active:
```json
{
  "statusCode": 404,
  "message": "Configuration de paiement non disponible",
  "error": "Not Found"
}
```

**Exemple avec Fetch**:
```javascript
async function getPaydunyaConfig() {
  try {
    const response = await fetch('http://localhost:3004/payment-config/paydunya');

    if (!response.ok) {
      throw new Error('Configuration non disponible');
    }

    const config = await response.json();
    console.log('Mode actif:', config.mode); // "test" ou "live"
    console.log('Public Key:', config.publicKey);
    console.log('API URL:', config.apiUrl);

    return config;
  } catch (error) {
    console.error('Erreur:', error);
    return null;
  }
}
```

**Exemple avec Axios**:
```javascript
import axios from 'axios';

async function getPaydunyaConfig() {
  try {
    const response = await axios.get('http://localhost:3004/payment-config/paydunya');
    const config = response.data;

    console.log('Configuration Paydunya:', config);
    return config;
  } catch (error) {
    console.error('Erreur:', error.response?.data || error.message);
    return null;
  }
}
```

---

## Endpoints Admin

**Authentification requise**: Tous les endpoints admin nécessitent un token JWT avec le rôle ADMIN ou SUPERADMIN.

**Headers requis**:
```http
Authorization: Bearer <votre_token_jwt>
Content-Type: application/json
```

### 1. Récupérer Toutes les Configurations

**Endpoint**: `GET /admin/payment-config`

**Requête**:
```http
GET http://localhost:3004/admin/payment-config
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200)**:
```json
[
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
]
```

**Note**: Les clés privées sont masquées pour la sécurité.

---

### 2. Récupérer la Configuration d'un Provider

**Endpoint**: `GET /admin/payment-config/:provider`

**Requête**:
```http
GET http://localhost:3004/admin/payment-config/paydunya
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse (200)**:
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

---

### 3. Basculer entre TEST et LIVE (Important!)

**Endpoint**: `POST /admin/payment-config/switch`

**Description**: Permet de basculer entre le mode TEST (sandbox) et LIVE (production) en une seule requête.

**Requête**:
```http
POST http://localhost:3004/admin/payment-config/switch
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "provider": "paydunya",
  "mode": "live"
}
```

**Réponse Success (200)** - Basculement vers LIVE:
```json
{
  "message": "Basculement réussi vers le mode LIVE",
  "config": {
    "id": 1,
    "provider": "paydunya",
    "isActive": true,
    "activeMode": "live",
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
    "updatedAt": "2026-02-12T14:56:41.000Z"
  },
  "previousMode": "test",
  "currentMode": "live"
}
```

**Requête pour Basculer vers TEST**:
```json
{
  "provider": "paydunya",
  "mode": "test"
}
```

**Réponse Error (400)** - Clés non configurées:
```json
{
  "statusCode": 400,
  "message": "Les clés LIVE ne sont pas configurées pour paydunya",
  "error": "Bad Request"
}
```

**Exemple avec Fetch**:
```javascript
async function switchPaydunyaMode(mode) {
  const token = localStorage.getItem('authToken'); // Votre token JWT

  try {
    const response = await fetch('http://localhost:3004/admin/payment-config/switch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'paydunya',
        mode: mode // 'test' ou 'live'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Basculement réussi:', result);
    console.log('Ancien mode:', result.previousMode);
    console.log('Nouveau mode:', result.currentMode);

    return result;
  } catch (error) {
    console.error('Erreur lors du basculement:', error);
    throw error;
  }
}

// Usage
switchPaydunyaMode('live'); // Passer en production
switchPaydunyaMode('test'); // Revenir en test
```

---

### 4. Créer une Nouvelle Configuration

**Endpoint**: `POST /admin/payment-config`

**Description**: Crée une nouvelle configuration pour un provider.

**Requête**:
```http
POST http://localhost:3004/admin/payment-config
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

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

**Note**: Lors de la création, vous spécifiez le `mode` ('test' ou 'live') et les clés seront stockées dans les champs appropriés (`testPrivateKey` ou `livePrivateKey`, etc.).

**Réponse Success (201)**:
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
  "livePublicKey": null,
  "livePrivateKey": null,
  "liveToken": null,
  "liveMasterKey": null,
  "webhookSecret": null,
  "metadata": {},
  "createdAt": "2026-02-12T10:34:12.000Z",
  "updatedAt": "2026-02-12T10:34:12.000Z"
}
```

---

### 5. Mettre à Jour une Configuration

**Endpoint**: `PATCH /admin/payment-config/:provider`

**Description**: Met à jour les clés TEST ou LIVE d'un provider existant.

**Requête** - Ajouter/Mettre à jour les clés LIVE:
```http
PATCH http://localhost:3004/admin/payment-config/paydunya
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "mode": "live",
  "publicKey": "live_public_JzyUBGQTafgpOPqRulSDGDVfHzz",
  "privateKey": "live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG",
  "token": "lt8YNn0GPW6DTIWcCZ8f",
  "masterKey": null
}
```

**Requête** - Mettre à jour les clés TEST:
```http
PATCH http://localhost:3004/admin/payment-config/paydunya
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "mode": "test",
  "publicKey": "test_public_NEW_KEY",
  "privateKey": "test_private_NEW_KEY",
  "token": "NEW_TOKEN"
}
```

**Réponse Success (200)**:
```json
{
  "id": 1,
  "provider": "paydunya",
  "isActive": true,
  "activeMode": "test",
  "testPublicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "testPrivateKey": "test...ucO",
  "testToken": "BuVS...9B",
  "livePublicKey": "live_public_JzyUBGQTafgpOPqRulSDGDVfHzz",
  "livePrivateKey": "live...TG",
  "liveToken": "lt8Y...8f",
  "webhookSecret": null,
  "metadata": {},
  "createdAt": "2026-02-12T10:34:12.000Z",
  "updatedAt": "2026-02-12T15:30:00.000Z"
}
```

---

### 6. Supprimer une Configuration

**Endpoint**: `DELETE /admin/payment-config/:provider`

**Requête**:
```http
DELETE http://localhost:3004/admin/payment-config/paydunya
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Réponse Success (200)**:
```json
{
  "message": "Configuration supprimée avec succès"
}
```

---

## Exemples de Code Frontend

### React Hook pour Récupérer la Configuration

```typescript
// hooks/usePaydunyaConfig.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

interface PaydunyaConfig {
  provider: string;
  isActive: boolean;
  mode: 'test' | 'live';
  publicKey: string;
  apiUrl: string;
}

export function usePaydunyaConfig() {
  const [config, setConfig] = useState<PaydunyaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await axios.get('http://localhost:3004/payment-config/paydunya');
        setConfig(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la récupération de la configuration');
        setConfig(null);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return { config, loading, error };
}
```

**Usage dans un composant**:
```typescript
import { usePaydunyaConfig } from './hooks/usePaydunyaConfig';

function PaymentComponent() {
  const { config, loading, error } = usePaydunyaConfig();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!config) return <div>Configuration non disponible</div>;

  return (
    <div>
      <h2>Configuration Paydunya</h2>
      <p>Mode: {config.mode === 'test' ? '🧪 TEST' : '🚀 LIVE'}</p>
      <p>Public Key: {config.publicKey}</p>
      <p>API URL: {config.apiUrl}</p>

      {config.mode === 'live' && (
        <div className="alert alert-warning">
          ⚠️ Mode PRODUCTION actif - Paiements réels
        </div>
      )}
    </div>
  );
}
```

---

### Interface Admin - Basculer entre TEST et LIVE

```typescript
// components/AdminPaymentConfig.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

interface PaymentConfig {
  provider: string;
  isActive: boolean;
  activeMode: 'test' | 'live';
  testPublicKey: string;
  livePublicKey: string;
}

export function AdminPaymentConfig() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // Récupérer la config actuelle
  async function fetchConfig() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:3004/admin/payment-config/paydunya', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  // Basculer de mode
  async function switchMode(mode: 'test' | 'live') {
    if (mode === 'live') {
      const confirmed = window.confirm(
        '⚠️ ATTENTION: Basculer en mode PRODUCTION ?\n\n' +
        'Toutes les transactions seront RÉELLES et FACTURÉES !'
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        'http://localhost:3004/admin/payment-config/switch',
        { provider: 'paydunya', mode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`✅ Basculement réussi vers le mode ${mode.toUpperCase()}`);
      await fetchConfig(); // Rafraîchir
    } catch (error: any) {
      alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConfig();
  }, []);

  if (!config) return <div>Chargement...</div>;

  return (
    <div className="payment-config-admin">
      <h2>Configuration Paydunya</h2>

      {/* Mode actuel */}
      <div className={`current-mode ${config.activeMode === 'live' ? 'live' : 'test'}`}>
        <h3>
          Mode actuel: {config.activeMode === 'test' ? '🧪 TEST' : '🚀 LIVE'}
        </h3>
        {config.activeMode === 'live' && (
          <div className="alert alert-danger">
            ⚠️ MODE PRODUCTION ACTIF - Paiements réels
          </div>
        )}
      </div>

      {/* Boutons de basculement */}
      <div className="mode-switcher">
        <button
          onClick={() => switchMode('test')}
          disabled={config.activeMode === 'test' || loading}
          className="btn btn-primary"
        >
          {loading ? 'Basculement...' : 'Activer mode TEST'}
        </button>

        <button
          onClick={() => switchMode('live')}
          disabled={config.activeMode === 'live' || loading}
          className="btn btn-danger"
        >
          {loading ? 'Basculement...' : 'Activer mode LIVE'}
        </button>
      </div>

      {/* Informations */}
      <div className="config-details">
        <h4>Mode TEST</h4>
        <p>Public Key: {config.testPublicKey}</p>

        <h4>Mode LIVE</h4>
        <p>Public Key: {config.livePublicKey}</p>
      </div>
    </div>
  );
}
```

**CSS Suggéré**:
```css
.current-mode.live {
  background-color: #fff3cd;
  border: 2px solid #ff6b6b;
  padding: 1rem;
  margin-bottom: 1rem;
}

.current-mode.test {
  background-color: #d1ecf1;
  border: 2px solid #0c5460;
  padding: 1rem;
  margin-bottom: 1rem;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
}

.mode-switcher {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Intégration avec Paydunya

### Créer un Paiement avec la Configuration Dynamique

```typescript
// services/payment.service.ts
import axios from 'axios';

interface PaydunyaConfig {
  mode: 'test' | 'live';
  publicKey: string;
  apiUrl: string;
}

interface PaymentData {
  amount: number;
  description: string;
  customerName: string;
  customerEmail: string;
}

export class PaymentService {
  private config: PaydunyaConfig | null = null;

  // Récupérer et mémoriser la config
  async loadConfig() {
    const response = await axios.get('http://localhost:3004/payment-config/paydunya');
    this.config = response.data;
    return this.config;
  }

  // Créer une facture de paiement
  async createPayment(data: PaymentData) {
    if (!this.config) {
      await this.loadConfig();
    }

    if (!this.config) {
      throw new Error('Configuration Paydunya non disponible');
    }

    try {
      // Appeler votre backend qui utilisera les clés privées
      const response = await axios.post('http://localhost:3004/paydunya/create-invoice', {
        invoice: {
          total_amount: data.amount,
          description: data.description
        },
        customer: {
          name: data.customerName,
          email: data.customerEmail
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Erreur création paiement:', error);
      throw error;
    }
  }

  // Vérifier le mode actuel
  isTestMode(): boolean {
    return this.config?.mode === 'test';
  }

  // Afficher un avertissement si en mode live
  showModeWarning() {
    if (this.config?.mode === 'live') {
      console.warn('⚠️ MODE PRODUCTION ACTIF - Paiements réels');
      return true;
    }
    return false;
  }
}
```

**Usage**:
```typescript
import { PaymentService } from './services/payment.service';

async function handlePayment() {
  const paymentService = new PaymentService();

  // Charger la config
  await paymentService.loadConfig();

  // Afficher un avertissement si en mode live
  if (paymentService.showModeWarning()) {
    const confirmed = confirm('Mode PRODUCTION actif. Continuer ?');
    if (!confirmed) return;
  }

  // Créer le paiement
  try {
    const result = await paymentService.createPayment({
      amount: 10000,
      description: 'Achat de produit',
      customerName: 'John Doe',
      customerEmail: 'john@example.com'
    });

    // Rediriger vers la page de paiement
    window.location.href = result.response_url;
  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

---

## Gestion des Erreurs

### Codes d'Erreur Possibles

| Code | Signification | Action |
|------|---------------|--------|
| 400 | Bad Request | Vérifier les données envoyées |
| 401 | Unauthorized | Token JWT manquant ou invalide |
| 403 | Forbidden | Rôle insuffisant (ADMIN requis) |
| 404 | Not Found | Configuration non trouvée |
| 500 | Internal Server Error | Erreur serveur, réessayer |

### Exemple de Gestion d'Erreurs

```typescript
async function apiCall(url: string, options: any) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json();

      switch (response.status) {
        case 400:
          throw new Error(`Données invalides: ${error.message}`);
        case 401:
          // Rediriger vers login
          window.location.href = '/login';
          throw new Error('Session expirée');
        case 403:
          throw new Error('Accès refusé - Droits admin requis');
        case 404:
          throw new Error('Configuration non trouvée');
        case 500:
          throw new Error('Erreur serveur - Réessayez plus tard');
        default:
          throw new Error(error.message || 'Erreur inconnue');
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
}
```

---

## Bonnes Pratiques

### 1. Mémoriser la Configuration

Ne récupérez la configuration qu'une seule fois au chargement de l'application:

```typescript
// store/paymentConfigStore.ts
import create from 'zustand';

interface PaymentConfigStore {
  config: any | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
}

export const usePaymentConfigStore = create<PaymentConfigStore>((set) => ({
  config: null,
  loading: false,
  error: null,

  fetchConfig: async () => {
    set({ loading: true });
    try {
      const response = await fetch('http://localhost:3004/payment-config/paydunya');
      const data = await response.json();
      set({ config: data, loading: false, error: null });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  }
}));
```

### 2. Afficher le Mode Actuel

Toujours indiquer à l'utilisateur si le site est en mode TEST ou LIVE:

```typescript
function ModeIndicator() {
  const { config } = usePaymentConfigStore();

  if (!config) return null;

  return (
    <div className={`mode-indicator ${config.mode}`}>
      {config.mode === 'test' ? (
        <span>🧪 Mode TEST - Paiements simulés</span>
      ) : (
        <span>🚀 Mode PRODUCTION - Paiements réels</span>
      )}
    </div>
  );
}
```

### 3. Validation des Paiements

Avant de créer un paiement en mode LIVE, demandez confirmation:

```typescript
async function createPayment(amount: number) {
  const config = await getPaydunyaConfig();

  if (config.mode === 'live') {
    const confirmed = window.confirm(
      `⚠️ Attention: Paiement réel de ${amount} FCFA\n\nConfirmer ?`
    );

    if (!confirmed) return;
  }

  // Procéder au paiement...
}
```

---

## Résumé des Endpoints

### Publics (Frontend)
- `GET /payment-config/paydunya` - Récupérer config active ✅

### Admin (Auth requise)
- `GET /admin/payment-config` - Lister toutes les configs ✅
- `GET /admin/payment-config/:provider` - Récupérer config d'un provider ✅
- `POST /admin/payment-config` - Créer une config ✅
- `PATCH /admin/payment-config/:provider` - Mettre à jour une config ✅
- `POST /admin/payment-config/switch` - **Basculer TEST/LIVE** ✅
- `DELETE /admin/payment-config/:provider` - Supprimer une config ✅

---

## Support

Pour toute question ou problème, consultez:
- Documentation backend: `docs/`
- Scripts de test: `scripts/test-payment-config.ts`
- Scripts de basculement: `scripts/switch-paydunya-mode.ts`

**Date**: 12 Février 2026
**Version**: 2.0.0
**Base URL**: http://localhost:3004
